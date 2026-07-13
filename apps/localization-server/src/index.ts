import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(fastifyCors, {
    origin:
        process.env.NODE_ENV === "production"
            ? ["https://your-production-domain.com"]
            : true,
});

await app.register(fastifyStatic, {
    root: join(__dirname, "public"),
    prefix: "/",
    wildcard: false,
});

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

app.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Localization server running on ${address}`);
});
