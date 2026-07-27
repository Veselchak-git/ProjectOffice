import type { Prisma } from "@/generated/prisma/client.js";
import type { FastifyRequestTypeBox } from "@/shared/lib/typebox/types.js";

import type {
    getPreferencesSchema,
    putPreferencesSchema,
    PutPreferencesBody,
    TableSettings,
} from "./schema.js";

export const getPreferencesService = async (
    request: FastifyRequestTypeBox<typeof getPreferencesSchema>
): Promise<{ settings?: TableSettings }> => {
    const userId = Number(request.user.sub);
    const { page } = request.query;

    const record = await request.server.prisma.userTableSetting.findUnique({
        where: { userId_page: { userId, page } },
    });

    if (!record) {
        return {};
    }

    return { settings: record.settings as unknown as TableSettings };
};

export const putPreferencesService = async (
    request: FastifyRequestTypeBox<typeof putPreferencesSchema>
): Promise<{ settings: TableSettings }> => {
    const userId = Number(request.user.sub);
    const { page, settings } = request.body as PutPreferencesBody;

    const record = await request.server.prisma.userTableSetting.upsert({
        where: { userId_page: { userId, page } },
        update: { settings: settings as Prisma.InputJsonValue },
        create: { userId, page, settings: settings as Prisma.InputJsonValue },
    });

    return { settings: record.settings as unknown as TableSettings };
};
