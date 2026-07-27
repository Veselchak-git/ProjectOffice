/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import ExcelJS from "exceljs";
import type { ExportProjectsBody, ExportIssuesBody, ExportUsersBody, ExportAuditLogBody } from "./schema.js";

// ---- types ----

interface BackendProject {
    id: number;
    name: string;
    description: string | null;
    status: string;
    versionCount: number;
    versions: { id: number; version: string }[];
    taskCount: number;
    responsible: string;
    createdAt: string;
}

interface BackendIssue {
    id: number;
    title: string;
    status: string;
    priority: string;
    category: string;
    projectName: string;
    assigneeLogin: string;
    createdAt: string;
}

interface BackendUser {
    id: number;
    login: string;
    role: string;
    createdAt: string;
}

interface BackendAuditLog {
    id: number;
    eventType: string;
    subjectType: string;
    subjectId: string;
    objectType: string;
    objectId: string;
    oldValue: string;
    newValue: string;
    subjectLogin: string;
    createdAt: string;
}

// ---- helpers ----

function translateStatus(status: string, locale: string): string {
    if (locale === "ru") {
        switch (status) {
            case "ACTIVE": return "Активен";
            case "ARCHIVED": return "Архивирован";
            default: return status;
        }
    }
    switch (status) {
        case "ACTIVE": return "Active";
        case "ARCHIVED": return "Archived";
        default: return status;
    }
}

function formatDate(dateStr: string, locale: string, timezone: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: timezone,
    }).format(date);
}

function translateIssueStatus(status: string, locale: string): string {
    if (locale === "ru") {
        switch (status) {
            case "OPEN": return "Открыта";
            case "IN_PROGRESS": return "В работе";
            case "RESOLVED": return "Решена";
            case "CLOSED": return "Закрыта";
            case "REOPENED": return "Переоткрыта";
            default: return status;
        }
    }
    switch (status) {
        case "OPEN": return "Open";
        case "IN_PROGRESS": return "In Progress";
        case "RESOLVED": return "Resolved";
        case "CLOSED": return "Closed";
        case "REOPENED": return "Reopened";
        default: return status;
    }
}

function translatePriority(priority: string, locale: string): string {
    if (locale === "ru") {
        switch (priority) {
            case "LOW": return "Низкий";
            case "MEDIUM": return "Средний";
            case "HIGH": return "Высокий";
            case "CRITICAL": return "Критический";
            default: return priority;
        }
    }
    switch (priority) {
        case "LOW": return "Low";
        case "MEDIUM": return "Medium";
        case "HIGH": return "High";
        case "CRITICAL": return "Critical";
        default: return priority;
    }
}

function translateCategory(category: string, locale: string): string {
    if (locale === "ru") {
        switch (category) {
            case "BUG": return "Ошибка";
            case "FEATURE": return "Функционал";
            case "TASK": return "Задача";
            case "IMPROVEMENT": return "Улучшение";
            default: return category;
        }
    }
    switch (category) {
        case "BUG": return "Bug";
        case "FEATURE": return "Feature";
        case "TASK": return "Task";
        case "IMPROVEMENT": return "Improvement";
        default: return category;
    }
}

function translateEventType(eventType: string, locale: string): string {
    if (locale === "ru") {
        switch (eventType) {
            case "USER_CREATED": return "Создание пользователя";
            case "USER_UPDATED": return "Обновление пользователя";
            case "USER_DELETED": return "Удаление пользователя";
            case "ISSUE_CREATED": return "Создание задачи";
            case "ISSUE_UPDATED": return "Обновление задачи";
            case "ISSUE_DELETED": return "Удаление задачи";
            case "PROJECT_CREATED": return "Создание проекта";
            case "PROJECT_UPDATED": return "Обновление проекта";
            case "PROJECT_DELETED": return "Удаление проекта";
            case "MEMBER_ADDED": return "Добавление участника";
            case "MEMBER_UPDATED": return "Обновление участника";
            case "MEMBER_REMOVED": return "Удаление участника";
            case "CREATE": return "Создание";
            case "UPDATE": return "Обновление";
            case "DELETE": return "Удаление";
            default: return eventType;
        }
    }
    switch (eventType) {
        case "USER_CREATED": return "User Created";
        case "USER_UPDATED": return "User Updated";
        case "USER_DELETED": return "User Deleted";
        case "ISSUE_CREATED": return "Issue Created";
        case "ISSUE_UPDATED": return "Issue Updated";
        case "ISSUE_DELETED": return "Issue Deleted";
        case "PROJECT_CREATED": return "Project Created";
        case "PROJECT_UPDATED": return "Project Updated";
        case "PROJECT_DELETED": return "Project Deleted";
        case "MEMBER_ADDED": return "Member Added";
        case "MEMBER_UPDATED": return "Member Updated";
        case "MEMBER_REMOVED": return "Member Removed";
        case "CREATE": return "Create";
        case "UPDATE": return "Update";
        case "DELETE": return "Delete";
        default: return eventType;
    }
}

function translateSubjectType(subjectType: string, locale: string): string {
    if (locale === "ru") {
        switch (subjectType) {
            case "USER": return "Пользователь";
            default: return subjectType;
        }
    }
    switch (subjectType) {
        case "USER": return "User";
        default: return subjectType;
    }
}

function translateObjectType(objectType: string, locale: string): string {
    if (locale === "ru") {
        switch (objectType) {
            case "ISSUE": return "Задача";
            case "PROJECT": return "Проект";
            case "USER": return "Пользователь";
            case "AUDIT_LOG": return "Аудит";
            default: return objectType;
        }
    }
    switch (objectType) {
        case "ISSUE": return "Issue";
        case "PROJECT": return "Project";
        case "USER": return "User";
        case "AUDIT_LOG": return "Audit";
        default: return objectType;
    }
}

// ---- public API ----

export function createExportWorkbook(
    params: ExportProjectsBody,
    projects: BackendProject[] = [],
): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Helpdesk Portal";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
        params.locale === "ru" ? "Проекты" : "Projects",
    );

    // Заголовки из columnHeaders (локализованные) или дефолтные
    const columnKeys = params.columnHeaders
        ? Object.keys(params.columnHeaders)
        : ["id", "name", "description", "status", "versionCount", "versions", "taskCount", "responsible", "createdAt"];

    // Стиль заголовков
    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    // Стиль данных
    const dataStyle: Partial<ExcelJS.Style> = {
        alignment: { vertical: "middle" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    // Колонки
    const columns = columnKeys.map((key) => ({
        header: params.columnHeaders?.[key] ?? key,
        key,
        width: 20,
    }));
    sheet.columns = columns;

    // Строка заголовков
    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    columns.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        Object.assign(cell, headerStyle);
    });

    // Строки данных
    const locale = params.locale ?? "ru";
    const timezone = params.timezone ?? "UTC";

    function getCellValue(proj: BackendProject, field: string): ExcelJS.CellValue {
        switch (field) {
            case "id": return proj.id;
            case "name": return proj.name;
            case "description": return proj.description ?? "";
            case "status": return translateStatus(proj.status, locale);
            case "versionCount": return proj.versionCount;
            case "versions": return proj.versions.map(v => v.version).join(", ");
            case "tasks":
        case "taskCount": return proj.taskCount;
            case "responsible": return proj.responsible;
            case "createdAt": return formatDate(proj.createdAt, locale, timezone);
            default: return "";
        }
    }

    projects.forEach((project, rowIndex) => {
        const row = sheet.getRow(rowIndex + 2);
        row.height = 22;

        columnKeys.forEach((key, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = getCellValue(project, key);
            Object.assign(cell, dataStyle);
        });
    });

    // Автофильтр (включает данные если они есть)
    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1 + projects.length, column: columns.length },
    };

    // Freeze header row
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    return workbook;
}

export async function generateExport(
    params: ExportProjectsBody,
    projects: BackendProject[] = [],
    _jwt?: string,
): Promise<Buffer> {
    void _jwt;
    const workbook = createExportWorkbook(params, projects);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export async function fetchProjectsFromBackend(
    backendUrl: string,
    filter?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
    jwt?: string,
): Promise<BackendProject[]> {
    const url = new URL(`${backendUrl}/api/projects/export`);
    if (filter) url.searchParams.set("filter", filter);
    if (sortBy) url.searchParams.set("sortBy", sortBy);
    if (sortOrder) url.searchParams.set("sortOrder", sortOrder);

    const headers: Record<string, string> = {};
    if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`;
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
        throw new Error(
            `Backend request failed: ${response.status} ${response.statusText}`,
        );
    }

    const data = await response.json() as { projects: BackendProject[] };
    return data.projects ?? [];
}

export async function fetchAndGenerateExport(
    params: ExportProjectsBody,
    backendUrl: string,
    jwt?: string,
): Promise<Buffer> {
    const projects = await fetchProjectsFromBackend(
        backendUrl,
        params.filter,
        params.sortBy,
        params.sortOrder,
        jwt,
    );
    return generateExport(params, projects, jwt);
}

// ---- issues export ----

export function createIssueExportWorkbook(
    params: ExportIssuesBody,
    issues: BackendIssue[] = [],
): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Helpdesk Portal";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
        params.locale === "ru" ? "Задачи" : "Issues",
    );

    const columnKeys = params.columnHeaders
        ? Object.keys(params.columnHeaders)
        : ["id", "title", "status", "priority", "category", "projectName", "assigneeLogin", "createdAt"];

    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    const dataStyle: Partial<ExcelJS.Style> = {
        alignment: { vertical: "middle" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    const columns = columnKeys.map((key) => ({
        header: params.columnHeaders?.[key] ?? key,
        key,
        width: 20,
    }));
    sheet.columns = columns;

    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    columns.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        Object.assign(cell, headerStyle);
    });

    const locale = params.locale ?? "ru";
    const timezone = params.timezone ?? "UTC";

    function getCellValue(issue: BackendIssue, field: string): ExcelJS.CellValue {
        switch (field) {
            case "id": return issue.id;
            case "title": return issue.title;
            case "status": return translateIssueStatus(issue.status, locale);
            case "priority": return translatePriority(issue.priority, locale);
            case "category": return translateCategory(issue.category, locale);
            case "projectName": return issue.projectName;
            case "assigneeLogin": return issue.assigneeLogin;
            case "createdAt": return formatDate(issue.createdAt, locale, timezone);
            default: return "";
        }
    }

    issues.forEach((issue, rowIndex) => {
        const row = sheet.getRow(rowIndex + 2);
        row.height = 22;

        columnKeys.forEach((key, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = getCellValue(issue, key);
            Object.assign(cell, dataStyle);
        });
    });

    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1 + issues.length, column: columns.length },
    };

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    return workbook;
}

export async function generateIssueExport(
    params: ExportIssuesBody,
    issues: BackendIssue[] = [],
    _jwt?: string,
): Promise<Buffer> {
    void _jwt;
    const workbook = createIssueExportWorkbook(params, issues);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export async function fetchIssuesFromBackend(
    backendUrl: string,
    filter?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
    jwt?: string,
): Promise<BackendIssue[]> {
    const url = new URL(`${backendUrl}/api/issues/export`);
    if (filter) url.searchParams.set("filter", filter);
    if (sortBy) url.searchParams.set("sortBy", sortBy);
    if (sortOrder) url.searchParams.set("sortOrder", sortOrder);

    const headers: Record<string, string> = {};
    if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`;
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
        throw new Error(
            `Backend request failed: ${response.status} ${response.statusText}`,
        );
    }

    const data = await response.json() as { issues: BackendIssue[] };
    return data.issues ?? [];
}

export async function fetchAndGenerateIssueExport(
    params: ExportIssuesBody,
    backendUrl: string,
    jwt?: string,
): Promise<Buffer> {
    const issues = await fetchIssuesFromBackend(
        backendUrl,
        params.filter,
        params.sortBy,
        params.sortOrder,
        jwt,
    );
    return generateIssueExport(params, issues, jwt);
}

// ---- users export ----

export function createUsersExportWorkbook(
    params: ExportUsersBody,
    users: BackendUser[] = [],
): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Helpdesk Portal";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
        params.locale === "ru" ? "Пользователи" : "Users",
    );

    const columnKeys = params.columnHeaders
        ? Object.keys(params.columnHeaders)
        : ["id", "login", "role", "createdAt"];

    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    const dataStyle: Partial<ExcelJS.Style> = {
        alignment: { vertical: "middle" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    const columns = columnKeys.map((key) => ({
        header: params.columnHeaders?.[key] ?? key,
        key,
        width: 20,
    }));
    sheet.columns = columns;

    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    columns.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        Object.assign(cell, headerStyle);
    });

    const locale = params.locale ?? "ru";
    const timezone = params.timezone ?? "UTC";

    function getCellValue(user: BackendUser, field: string): ExcelJS.CellValue {
        switch (field) {
            case "id": return user.id;
            case "login": return user.login;
            case "role": return user.role;
            case "createdAt": return formatDate(user.createdAt, locale, timezone);
            default: return "";
        }
    }

    users.forEach((user, rowIndex) => {
        const row = sheet.getRow(rowIndex + 2);
        row.height = 22;

        columnKeys.forEach((key, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = getCellValue(user, key);
            Object.assign(cell, dataStyle);
        });
    });

    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1 + users.length, column: columns.length },
    };

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    return workbook;
}

export async function generateUsersExport(
    params: ExportUsersBody,
    users: BackendUser[] = [],
    _jwt?: string,
): Promise<Buffer> {
    void _jwt;
    const workbook = createUsersExportWorkbook(params, users);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export async function fetchUsersFromBackend(
    backendUrl: string,
    filter?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
    jwt?: string,
): Promise<BackendUser[]> {
    const url = new URL(`${backendUrl}/api/users/export`);
    if (filter) url.searchParams.set("filter", filter);
    if (sortBy) url.searchParams.set("sortBy", sortBy);
    if (sortOrder) url.searchParams.set("sortOrder", sortOrder);

    const headers: Record<string, string> = {};
    if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`;
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
        throw new Error(
            `Backend request failed: ${response.status} ${response.statusText}`,
        );
    }

    const data = await response.json() as { users: BackendUser[] };
    return data.users ?? [];
}

export async function fetchAndGenerateUsersExport(
    params: ExportUsersBody,
    backendUrl: string,
    jwt?: string,
): Promise<Buffer> {
    const users = await fetchUsersFromBackend(
        backendUrl,
        params.filter,
        params.sortBy,
        params.sortOrder,
        jwt,
    );
    return generateUsersExport(params, users, jwt);
}

// ---- audit-log export ----

export function createAuditLogExportWorkbook(
    params: ExportAuditLogBody,
    logs: BackendAuditLog[] = [],
): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Helpdesk Portal";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
        params.locale === "ru" ? "Журнал аудита" : "Audit Log",
    );

    const columnKeys = params.columnHeaders
        ? Object.keys(params.columnHeaders)
        : ["id", "eventType", "subjectType", "subjectId", "objectType", "objectId", "oldValue", "newValue", "subjectLogin", "createdAt"];

    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    const dataStyle: Partial<ExcelJS.Style> = {
        alignment: { vertical: "middle" },
        border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    };

    const columns = columnKeys.map((key) => ({
        header: params.columnHeaders?.[key] ?? key,
        key,
        width: 20,
    }));
    sheet.columns = columns;

    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    columns.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        Object.assign(cell, headerStyle);
    });

    const locale = params.locale ?? "ru";
    const timezone = params.timezone ?? "UTC";

    function getCellValue(log: BackendAuditLog, field: string): ExcelJS.CellValue {
        switch (field) {
            case "id": return log.id;
            case "eventType": return translateEventType(log.eventType, locale);
            case "subjectType": return translateSubjectType(log.subjectType, locale);
            case "subjectId": return log.subjectId;
            case "objectType": return translateObjectType(log.objectType, locale);
            case "objectId": return log.objectId;
            case "oldValue": return log.oldValue;
            case "newValue": return log.newValue;
            case "subjectLogin": return log.subjectLogin;
            case "createdAt": return formatDate(log.createdAt, locale, timezone);
            default: return "";
        }
    }

    logs.forEach((log, rowIndex) => {
        const row = sheet.getRow(rowIndex + 2);
        row.height = 22;

        columnKeys.forEach((key, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = getCellValue(log, key);
            Object.assign(cell, dataStyle);
        });
    });

    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1 + logs.length, column: columns.length },
    };

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    return workbook;
}

export async function generateAuditLogExport(
    params: ExportAuditLogBody,
    logs: BackendAuditLog[] = [],
    _jwt?: string,
): Promise<Buffer> {
    void _jwt;
    const workbook = createAuditLogExportWorkbook(params, logs);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export async function fetchAuditLogFromBackend(
    backendUrl: string,
    filter?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
    jwt?: string,
): Promise<BackendAuditLog[]> {
    const url = new URL(`${backendUrl}/api/audit-log/export`);
    if (filter) url.searchParams.set("filter", filter);
    if (sortBy) url.searchParams.set("sortBy", sortBy);
    if (sortOrder) url.searchParams.set("sortOrder", sortOrder);

    const headers: Record<string, string> = {};
    if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`;
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
        throw new Error(
            `Backend request failed: ${response.status} ${response.statusText}`,
        );
    }

    const data = await response.json() as { logs: BackendAuditLog[] };
    return data.logs ?? [];
}

export async function fetchAndGenerateAuditLogExport(
    params: ExportAuditLogBody,
    backendUrl: string,
    jwt?: string,
): Promise<Buffer> {
    const logs = await fetchAuditLogFromBackend(
        backendUrl,
        params.filter,
        params.sortBy,
        params.sortOrder,
        jwt,
    );
    return generateAuditLogExport(params, logs, jwt);
}
