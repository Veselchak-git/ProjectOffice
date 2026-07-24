#!/usr/bin/env node

/**
 * SSE Load Test — нагрузочное тестирование SSE-соединений.
 *
 * Чистый Node.js без внешних зависимостей (node:http + node:events).
 *
 * Использование:
 *   node scripts/sse-load-test.mjs [опции]
 *
 * Пример:
 *   node scripts/sse-load-test.mjs --host localhost --port 3000 --login admin --password admin123
 */

import http from "node:http";
import https from "node:https";
import { EventEmitter } from "node:events";

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

const DEFAULT_CONFIG = {
  host: "localhost",
  port: 3000,
  login: "admin@example.com",
  password: "admin123",
  stages: [
    { concurrency: 10, duration: 60 },
    { concurrency: 50, duration: 60 },
    { concurrency: 100, duration: 60 },
    { concurrency: 200, duration: 60 },
  ],
  eventInterval: 10,
  injectPath: "/api/projects",
  useSsl: false,
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function parseArgs(argv) {
  const args = argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--host":
        config.host = next;
        i++;
        break;
      case "--port":
        config.port = Number(next);
        i++;
        break;
      case "--login":
        config.login = next;
        i++;
        break;
      case "--password":
        config.password = next;
        i++;
        break;
      case "--stages":
        config.stages = next.split(",").map((s) => {
          const [concurrency, duration] = s.split(":").map(Number);
          return { concurrency, duration };
        });
        i++;
        break;
      case "--event-interval":
        config.eventInterval = Number(next);
        i++;
        break;
      case "--inject-path":
        config.injectPath = next;
        i++;
        break;
      case "--ssl":
        config.useSsl = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
SSE Load Test — нагрузочное тестирование SSE-соединений

Использование:
  node scripts/sse-load-test.mjs [опции]

Опции:
  --host <hostname>       Хост backend-сервера (по умолчанию: localhost)
  --port <number>         Порт backend-сервера (по умолчанию: 3000)
  --login <email>         Email пользователя (по умолчанию: admin@example.com)
  --password <password>   Пароль пользователя (по умолчанию: admin123)
  --stages <concurrency:duration,...>
                          Стадии нагрузки (по умолчанию: 10:60,50:60,100:60,200:60)
  --event-interval <sec>  Интервал между инъекциями событий (по умолчанию: 10)
  --inject-path <path>    Эндпоинт для инъекции событий (по умолчанию: /api/projects)
  --ssl                   Использовать HTTPS вместо HTTP
  --help                  Показать справку
`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  return min > 0 ? `${min}m ${sec % 60}s` : `${sec}s`;
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function padLeft(str, len) {
  return String(str).padStart(len);
}

// ============================================================================
// HTTP-ЗАПРОСЫ (обёртка над node:http)
// ============================================================================

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const proto = options.useSsl ? https : http;
    const req = proto.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const rawBody = Buffer.concat(chunks).toString("utf-8");
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: rawBody,
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(10_000, () => {
      req.destroy(new Error("Request timeout"));
    });

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function parseCookies(setCookieHeaders) {
  const cookies = {};
  const headers = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders].filter(Boolean);

  for (const header of headers) {
    const parts = header.split(";")[0].split("=");
    const name = parts[0].trim();
    const value = parts.slice(1).join("=").trim();
    if (name) {
      cookies[name] = value;
    }
  }
  return cookies;
}

// ============================================================================
// АУТЕНТИФИКАЦИЯ
// ============================================================================

async function getSession(config) {
  const { host, port, login, password, useSsl } = config;
  const base = `${useSsl ? "https" : "http"}://${host}:${port}`;

  // Шаг 1: логин → JWT
  console.log(`[auth] Логин: ${login}...`);
  const loginRes = await makeRequest({
    hostname: host,
    port,
    path: "/api/auth/login",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    useSsl,
  }, JSON.stringify({ login, password }));

  if (loginRes.statusCode !== 200) {
    throw new Error(`Ошибка логина (${loginRes.statusCode}): ${loginRes.body}`);
  }

  const { accessToken } = JSON.parse(loginRes.body);
  console.log(`[auth] JWT получен (${accessToken.slice(0, 20)}...)`);

  return { accessToken };
}

// ============================================================================
// SSE-КЛИЕНТ
// ============================================================================

class SseClient extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this._req = null;
    this._buffer = "";
    this._connected = false;
    this._connectStart = 0;
    this._connectLatency = 0;
    this._lastEventTime = 0;
  }

  get isConnected() {
    return this._connected;
  }

  get connectLatency() {
    return this._connectLatency;
  }

  connect(config, accessToken) {
    this._connectStart = Date.now();

    const options = {
      hostname: config.host,
      port: config.port,
      path: "/api/audit-log/stream",
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const proto = config.useSsl ? https : http;
    this._req = proto.request(options, (res) => {
      if (res.statusCode !== 200) {
        this._connected = false;
        this.emit("error", new Error(`SSE ${res.statusCode}: ${res.statusCode === 401 ? "Unauthorized" : res.statusCode}`));
        res.resume();
        return;
      }

      this._connected = true;
      this._connectLatency = Date.now() - this._connectStart;
      this.emit("connected");

      res.setEncoding("utf-8");

      res.on("data", (chunk) => {
        this._buffer += chunk;
        this._processBuffer();
      });

      res.on("end", () => {
        this._connected = false;
        this.emit("disconnected");
      });
    });

    this._req.on("error", (err) => {
      this._connected = false;
      this.emit("error", err);
    });

    this._req.setTimeout(120_000);
    this._req.end();
  }

  _processBuffer() {
    const lines = this._buffer.split("\n");
    this._buffer = lines.pop() || "";

    let currentEvent = null;

    for (const line of lines) {
      const trimmed = line.trimEnd();

      if (trimmed === "") {
        currentEvent = null;
        continue;
      }

      // Heartbeat: ": heartbeat"
      if (trimmed.startsWith(":")) {
        this.emit("heartbeat");
        continue;
      }

      // SSE data line: "data: {...}"
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          this._lastEventTime = Date.now();
          this.emit("event", data);
        } catch {
          // malformed JSON — игнорируем
        }
        continue;
      }

      // event: line (не используется сервером, но парсим на всякий случай)
      if (trimmed.startsWith("event: ")) {
        currentEvent = trimmed.slice(7);
        continue;
      }

      // id: line
      if (trimmed.startsWith("id: ")) {
        continue;
      }

      // retry: line
      if (trimmed.startsWith("retry: ")) {
        continue;
      }
    }
  }

  disconnect() {
    if (this._req) {
      this._req.destroy();
      this._req = null;
    }
    this._connected = false;
    this.removeAllListeners();
  }
}

// ============================================================================
// МЕТРИКИ
// ============================================================================

class Metrics {
  constructor() {
    this.connectLatencies = [];
    this.errors = 0;
    this.authErrors = 0;
    this.totalEvents = 0;
    this.eventsByType = {};
    this.heartbeats = 0;
    this.connected = 0;
    this.disconnected = 0;
    this.maxConcurrent = 0;
    this.injectSuccess = 0;
    this.injectErrors = 0;
    this._stageStart = 0;
    this._stageEvents = 0;
    this._stageHeartbeats = 0;
    this._intervalStart = 0;
    this._intervalEvents = 0;
    this._intervalHeartbeats = 0;
    this._allTimeStart = Date.now();
  }

  trackConnect(duration) {
    this.connectLatencies.push(duration);
  }

  trackError(isAuth = false) {
    if (isAuth) {
      this.authErrors++;
    } else {
      this.errors++;
    }
  }

  trackEvent(type) {
    this.totalEvents++;
    this.eventsByType[type] = (this.eventsByType[type] || 0) + 1;
    this._stageEvents++;
    this._intervalEvents++;
  }

  trackHeartbeat() {
    this.heartbeats++;
    this._stageHeartbeats++;
    this._intervalHeartbeats++;
  }

  trackInjectSuccess() {
    this.injectSuccess++;
  }

  trackInjectError() {
    this.injectErrors++;
  }

  updateConnected(delta) {
    this.connected = Math.max(0, this.connected + delta);
    if (this.connected > this.maxConcurrent) {
      this.maxConcurrent = this.connected;
    }
  }

  startInterval() {
    this._intervalStart = Date.now();
    this._intervalEvents = 0;
    this._intervalHeartbeats = 0;
  }

  getIntervalStats() {
    const elapsed = Date.now() - this._intervalStart;
    return {
      elapsed,
      events: this._intervalEvents,
      heartbeats: this._intervalHeartbeats,
      eventsPerSec: elapsed > 0 ? ((this._intervalEvents / elapsed) * 1000).toFixed(1) : "0",
    };
  }

  getLatencyStats() {
    if (this.connectLatencies.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.connectLatencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(sum / sorted.length),
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    };
  }

  report(concurrency) {
    const lat = this.getLatencyStats();
    const uptime = formatDuration(Date.now() - this._allTimeStart);

    const lines = [
      "",
      "┌─────────────────────────────────────────────────────────┐",
      "│                    МЕТРИКИ НАГРУЗКИ                      │",
      "├─────────────────────────────────────────────────────────┤",
      `│  Время работы:        ${pad(uptime, 33)}│`,
      `│  Коннектов сейчас:    ${padLeft(String(this.connected), 33)}│`,
      `│  Коннектов всего:     ${padLeft(String(this.connectLatencies.length), 33)}│`,
      `│  Макс. параллельных:  ${padLeft(String(this.maxConcurrent), 33)}│`,
      "├─────────────────────────────────────────────────────────┤",
      `│  Latency (подключение):                                  │`,
      `│    min: ${padLeft(lat.min + "ms", 8)} avg: ${padLeft(lat.avg + "ms", 8)} p50: ${padLeft(lat.p50 + "ms", 8)}│`,
      `│    max: ${padLeft(lat.max + "ms", 8)} p95: ${padLeft(lat.p95 + "ms", 8)} p99: ${padLeft(lat.p99 + "ms", 8)}│`,
      "├─────────────────────────────────────────────────────────┤",
      `│  Событий всего:       ${padLeft(String(this.totalEvents), 33)}│`,
      `│  Heartbeat'ов:        ${padLeft(String(this.heartbeats), 33)}│`,
      `│  Ошибок (не-auth):    ${padLeft(String(this.errors), 33)}│`,
      `│  Ошибок (auth):       ${padLeft(String(this.authErrors), 33)}│`,
      "├─────────────────────────────────────────────────────────┤",
      `│  Инъекций (успех):    ${padLeft(String(this.injectSuccess), 33)}│`,
      `│  Инъекций (ошибка):   ${padLeft(String(this.injectErrors), 33)}│`,
    ];

    if (Object.keys(this.eventsByType).length > 0) {
      lines.push("├─────────────────────────────────────────────────────────┤");
      lines.push("│  События по типам:                                       │");
      for (const [type, count] of Object.entries(this.eventsByType)) {
        lines.push(`│    ${pad(type, 24)} ${padLeft(String(count), 28)}│`);
      }
    }

    lines.push("└─────────────────────────────────────────────────────────┘");
    lines.push("");

    return lines.join("\n");
  }

  summary() {
    const lat = this.getLatencyStats();
    const totalUptime = formatDuration(Date.now() - this._allTimeStart);
    const totalConns = this.connectLatencies.length;

    const lines = [
      "",
      "╔═══════════════════════════════════════════════════════════╗",
      "║                 ИТОГОВЫЙ ОТЧЁТ                           ║",
      "╠═══════════════════════════════════════════════════════════╣",
      `║  Общее время:           ${pad(totalUptime, 34)}║`,
      `║  Всего коннектов:       ${padLeft(String(totalConns), 34)}║`,
      `║  Макс. параллельных:    ${padLeft(String(this.maxConcurrent), 34)}║`,
      "║                                                           ║",
      `║  Latency (мс):                                        ║`,
      `║    min: ${padLeft(lat.min, 6)}   avg: ${padLeft(lat.avg, 6)}   p50: ${padLeft(lat.p50, 6)}              ║`,
      `║    max: ${padLeft(lat.max, 6)}   p95: ${padLeft(lat.p95, 6)}   p99: ${padLeft(lat.p99, 6)}              ║`,
      "║                                                           ║",
      `║  Событий получено:       ${padLeft(String(this.totalEvents), 34)}║`,
      `║  Heartbeat'ов:           ${padLeft(String(this.heartbeats), 34)}║`,
      `║  Ошибок подключения:    ${padLeft(String(this.errors), 34)}║`,
      `║  Ошибок аутентификации: ${padLeft(String(this.authErrors), 34)}║`,
      "║                                                           ║",
      `║  Инъекций (успех):       ${padLeft(String(this.injectSuccess), 34)}║`,
      `║  Инъекций (ошибка):      ${padLeft(String(this.injectErrors), 34)}║`,
    ];

    if (Object.keys(this.eventsByType).length > 0) {
      lines.push("║                                                           ║");
      lines.push("║  События по типам:                                       ║");
      for (const [type, count] of Object.entries(this.eventsByType)) {
        lines.push(`║    ${pad(type, 24)} ${padLeft(String(count), 28)}║`);
      }
    }

    lines.push("╚═══════════════════════════════════════════════════════════╝");
    lines.push("");

    return lines.join("\n");
  }
}

// ============================================================================
// ГЕНЕРАТОР НАГРУЗКИ
// ============================================================================

async function runLoadTest(config) {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║              SSE LOAD TEST — НАГРУЗОЧНОЕ ТЕСТИРОВАНИЕ     ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`  Хост:       ${config.host}:${config.port}`);
  console.log(`  Логин:      ${config.login}`);
  console.log(`  Стадии:     ${config.stages.map((s) => `${s.concurrency}conn/${s.duration}s`).join(" → ")}`);
  console.log(`  Инъекция:   каждые ${config.eventInterval}s через ${config.injectPath}`);
  console.log();

  // Получаем сессию
  let session;
  try {
    session = await getSession(config);
  } catch (err) {
    console.error(`[FATAL] Не удалось получить сессию: ${err.message}`);
    process.exit(1);
  }

  const metrics = new Metrics();
  const clients = [];
  let shuttingDown = false;

  // --- Обработка Ctrl+C ---
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\n[shutdown] Отключение всех клиентов...");

    // Отключаем всех клиентов
    for (const client of clients) {
      if (client.isConnected) {
        client.disconnect();
      }
    }

    // Очищаем интервал инъекции
    if (injectTimer) {
      clearInterval(injectTimer);
    }

    // Останавливаем интервал метрик
    if (metricsTimer) {
      clearInterval(metricsTimer);
    }

    // Ждём немного для завершения обработчиков
    await sleep(500);

    console.log(metrics.summary());
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // --- Инъекция событий ---
  let injectTimer = null;
  let injectErrorLogged = 0;

  const refreshSession = async () => {
    console.log("[auth] Токен истёк, обновление сессии...");
    try {
      session = await getSession(config);
      console.log("[auth] Сессия обновлена успешно");
    } catch (err) {
      console.error(`[auth] Ошибка обновления сессии: ${err.message}`);
      throw err;
    }
  };

  const injectEvent = async () => {
    if (shuttingDown) return;
    try {
      const res = await makeRequest({
        hostname: config.host,
        port: config.port,
        path: config.injectPath,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        useSsl: config.useSsl,
      }, JSON.stringify({
        name: `load-test-${Date.now()}`,
        description: "Создано нагрузочным тестом SSE",
        versions: ["1.0"],
      }));

      if (res.statusCode >= 200 && res.statusCode < 300) {
        metrics.trackInjectSuccess();
      } else if (res.statusCode === 401) {
        // Токен истёк — обновляем сессию и повторяем запрос
        metrics.trackInjectError();
        await refreshSession();
        // Повторная попытка с новым токеном
        const retryRes = await makeRequest({
          hostname: config.host,
          port: config.port,
          path: config.injectPath,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          useSsl: config.useSsl,
        }, JSON.stringify({
          name: `load-test-${Date.now()}`,
          description: "Создано нагрузочным тестом SSE",
          versions: ["1.0"],
        }));
        if (retryRes.statusCode >= 200 && retryRes.statusCode < 300) {
          metrics.trackInjectSuccess();
        } else {
          metrics.trackInjectError();
        }
      } else {
        metrics.trackInjectError();
        if (injectErrorLogged < 5) {
          injectErrorLogged++;
          const bodySnippet = res.body?.slice(0, 200) || "(пусто)";
          console.log(`[inject ERROR] HTTP ${res.statusCode} | ${bodySnippet}`);
        }
      }
    } catch (err) {
      metrics.trackInjectError();
      if (injectErrorLogged < 5) {
        injectErrorLogged++;
        console.log(`[inject ERROR] ${err.code || err.message}`);
      }
    }
  };

  // --- Интервал вывода метрик ---
  let metricsTimer = null;

  const printMetrics = () => {
    console.log(metrics.report(0));
  };

  // --- Запуск ---
  let totalCreated = 0;

  for (const stage of config.stages) {
    if (shuttingDown) break;

    const stageTarget = stage.concurrency;
    const currentCount = clients.length;
    const toCreate = stageTarget - currentCount;

    console.log(`\n[stage] === Стадия: ${stageTarget} соединений (${stage.duration}с) ===`);
    console.log(`[stage] Текущих: ${currentCount}, нужно создать: ${toCreate > 0 ? toCreate : 0}`);

    // Если нужно уменьшить количество — отключаем лишних
    if (toCreate < 0) {
      const toRemove = Math.abs(toCreate);
      console.log(`[stage] Отключение ${toRemove} лишних клиентов...`);
      for (let i = 0; i < toRemove && clients.length > stageTarget; i++) {
        const client = clients.pop();
        if (client && client.isConnected) {
          client.disconnect();
          metrics.updateConnected(-1);
        }
      }
    }

    // Плавное подключение (ramp up): по 1 соединению каждые 100мс
    if (toCreate > 0) {
      const rampDelay = Math.max(10, Math.min(500, (stage.duration * 1000) / (toCreate * 2)));
      console.log(`[ramp] Подключение ${toCreate} клиентов (задержка ${Math.round(rampDelay)}мс между коннектами)...`);

      for (let i = 0; i < toCreate && !shuttingDown; i++) {
        const clientId = totalCreated++;
        const client = new SseClient(clientId);

        client.on("connected", () => {
          metrics.trackConnect(client.connectLatency);
          metrics.updateConnected(1);
        });

        client.on("event", (data) => {
          metrics.trackEvent(data.type || "unknown");
        });

        client.on("heartbeat", () => {
          metrics.trackHeartbeat();
        });

        client.on("error", (err) => {
          const isAuth = err.message.includes("401") || err.message.includes("Unauthorized");
          metrics.trackError(isAuth);
        });

        client.on("disconnected", () => {
          metrics.updateConnected(-1);
        });

        client.connect(config, session.accessToken);
        clients.push(client);

        await sleep(rampDelay);
      }
    }

    console.log(`[stage] Все ${Math.min(stageTarget, clients.length)} клиентов подключены, ожидание ${stage.duration}с...`);

    // Запускаем инъекцию событий
    if (config.eventInterval > 0) {
      if (injectTimer) clearInterval(injectTimer);
      injectTimer = setInterval(injectEvent, config.eventInterval * 1000);
      // Первая инъекция сразу
      injectEvent();
    }

    // Запускаем вывод метрик каждые 5 секунд
    if (metricsTimer) clearInterval(metricsTimer);
    metrics.startInterval();
    metricsTimer = setInterval(printMetrics, 5_000);

    // Ждём стадию
    await sleep(stage.duration * 1000);
  }

  // Финальный вывод
  if (injectTimer) clearInterval(injectTimer);
  if (metricsTimer) clearInterval(metricsTimer);

  console.log("\n[done] Все стадии завершены. Отключение клиентов...");

  for (const client of clients) {
    if (client.isConnected) {
      client.disconnect();
    }
  }

  await sleep(500);

  console.log(metrics.summary());
}

// ============================================================================
// ТОЧКА ВХОДА
// ============================================================================

const config = parseArgs(process.argv);
runLoadTest(config).catch((err) => {
  console.error(`[FATAL] ${err.message}`);
  process.exit(1);
});
