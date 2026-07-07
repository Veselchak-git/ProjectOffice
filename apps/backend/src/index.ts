/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { app } from "@/app/index.js";

const appInstance = await app();

const {
    config: { HOST, PORT }
} = appInstance;

appInstance.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
        appInstance.log.error(err);
        process.exit(1);
    }
    appInstance.log.info(`Server is running on ${address}`);
});
