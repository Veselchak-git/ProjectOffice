/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

export const COMMON = "common";
export const AUTH = "auth";
export const NAVIGATION = "navigation";
export const USERS = "users";
export const PROJECTS = "projects";
export const ISSUES = "issues";
export const AUDIT = "audit";
export const VALIDATION = "validation";
export const HOME = "home";
export const DATE_TIME_PICKER = "dateTimePicker";

export type Namespace =
    | typeof COMMON
    | typeof AUTH
    | typeof NAVIGATION
    | typeof USERS
    | typeof PROJECTS
    | typeof ISSUES
    | typeof AUDIT
    | typeof VALIDATION
    | typeof HOME
    | typeof DATE_TIME_PICKER;

export const ALL_NAMESPACES: Namespace[] = [
    COMMON,
    AUTH,
    NAVIGATION,
    USERS,
    PROJECTS,
    ISSUES,
    AUDIT,
    VALIDATION,
    HOME,
    DATE_TIME_PICKER,
];
