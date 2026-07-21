/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { AuditLogPageState } from "@/pages/audit-log-page/model/audit-log-page-slice";
import type { IssuesPageState } from "@/pages/issues-page/model/issues-page-slice";
import type { ProjectsPageState } from "@/pages/projects-page/model/projects-page-slice";
import type { UsersPageState } from "@/pages/users-page/model/users-page-slice";

import type { AuthState } from "@/shared/lib/auth";

export interface LazyLoadedReduxSlices {
    auth: AuthState;
    projectsPage: ProjectsPageState;
    issuesPage: IssuesPageState;
    usersPage: UsersPageState;
    auditLogPage: AuditLogPageState;
}
