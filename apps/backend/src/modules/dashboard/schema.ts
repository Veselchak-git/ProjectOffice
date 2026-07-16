import { type Static, Type } from "@fastify/type-provider-typebox";

import { IssuePriority, IssueStatus, ProjectStatus } from "@/generated/prisma/enums.js";
import { issueResponseSchema } from "@/modules/issues/schema.js";

export const projectSummarySchema = Type.Object({
    projectId: Type.Number(),
    projectName: Type.String(),
    byStatus: Type.Record(Type.Enum(IssueStatus), Type.Number()),
    byPriority: Type.Record(Type.Enum(IssuePriority), Type.Number()),
});

export type ProjectSummary = Static<typeof projectSummarySchema>;

export const activityTypeEnum = Type.Union([
    Type.Literal("issue_created"),
    Type.Literal("status_changed"),
    Type.Literal("assigned"),
]);

export type ActivityType = Static<typeof activityTypeEnum>;

export const projectListItemSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
    status: Type.Enum(ProjectStatus),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    updatedAt: Type.String(),
    totalIssues: Type.Number(),
    openIssues: Type.Number(),
});

export type ProjectListItem = Static<typeof projectListItemSchema>;

export const activityItemSchema = Type.Object({
    id: Type.Number(),
    type: activityTypeEnum,
    message: Type.String(),
    timestamp: Type.String(),
    projectName: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    issueId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
});

export type ActivityItem = Static<typeof activityItemSchema>;

export const dashboardSummarySchema = Type.Object({
    totalProjects: Type.Number(),
    totalAssigned: Type.Number(),
    totalClosed: Type.Number(),
    totalUsers: Type.Optional(Type.Number()),
});

export const dashboardResponseSchema = Type.Object({
    summary: dashboardSummarySchema,
    projects: Type.Array(projectListItemSchema),
    activity: Type.Array(activityItemSchema),
    myIssues: Type.Array(issueResponseSchema),
});

export type DashboardResponse = Static<typeof dashboardResponseSchema>;

export const getDashboardSchema = {
    response: {
        200: dashboardResponseSchema,
    },
};
