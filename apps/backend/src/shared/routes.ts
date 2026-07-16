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
export const AUTH_REFRESH_PATH = `${AUTH_PATH}/refresh`;
export const AUTH_LOGOUT_PATH = `${AUTH_PATH}/logout`;
export const AUTH_ME_PATH = `${AUTH_PATH}/me`;
export const AUTH_ME_PASSWORD_PATH = `${AUTH_ME_PATH}/password`;
export const PROJECTS_PATH = "/projects";
export const PROJECTS_LIST_PATH = PROJECTS_PATH;
export const PROJECT_PATH = `${PROJECTS_PATH}/:id`;
export const PROJECT_MEMBERS_PATH = `${PROJECT_PATH}/members`;
export const PROJECT_MEMBER_PATH = `${PROJECT_PATH}/members/:userId`;
export const AUDIT_LOG_PATH = "/audit-log";
export const AUDIT_LOG_AVAILABLE_PATH = `${AUDIT_LOG_PATH}/available`;
export const USERS_PATH = "/users";
export const USER_PATH = `${USERS_PATH}/:id`;
export const ISSUES_PATH = "/issues";
export const ISSUE_PATH = `${ISSUES_PATH}/:id`;
export const PROJECT_ISSUES_PATH = `${PROJECT_PATH}/issues`;
export const DASHBOARD_PATH = "/dashboard";
