/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { IssuesPageState } from "@/pages/issues-page/model/issues-page-slice";
import type { ProjectsPageState } from "@/pages/projects-page/model/projects-page-slice";
import type { UsersPageState } from "@/pages/users-page/model/users-page-slice";

import type { AuthState } from "@/shared/lib/auth";
import type { LocaleState } from "@/shared/lib/i18n";

export interface LazyLoadedReduxSlices {
    auth: AuthState;
    locale: LocaleState;
    projectsPage: ProjectsPageState;
    issuesPage: IssuesPageState;
    usersPage: UsersPageState;
}
