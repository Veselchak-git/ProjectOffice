/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

export const PREFIX = "/api";
export const PING_PATH = `/ping`;
export const AUTH_PATH = "/auth";
export const AUTH_LOGIN_PATH = `${AUTH_PATH}/login`;
export const AUTH_ME_PATH = `${AUTH_PATH}/me`;
export const AUTH_ME_PASSWORD_PATH = `${AUTH_ME_PATH}/password`;
export const EXAMPLE_MODULE_PATH = "/example-module";
export const EXAMPLE_PROFILE_PATH = `${EXAMPLE_MODULE_PATH}/profile`;
export const EXAMPLE_ADMIN_PATH = `${EXAMPLE_MODULE_PATH}/admin`;
export const PROJECTS_PATH = "/projects";
export const PROJECTS_LIST_PATH = PROJECTS_PATH;
export const PROJECT_PATH = `${PROJECTS_PATH}/:id`;
