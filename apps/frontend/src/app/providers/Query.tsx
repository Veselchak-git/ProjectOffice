/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { QueryClientProvider } from "@tanstack/react-query";
import type { FC, PropsWithChildren } from "react";

import { queryClient } from "@/shared/lib/query-client";

export const QueryProvider: FC<PropsWithChildren> = ({ children }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
