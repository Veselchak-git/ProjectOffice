/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { FC, PropsWithChildren } from "react";
import { Provider } from "react-redux";

import { store } from "../store";

export const ReduxProvider: FC<PropsWithChildren> = ({ children }) => {
    return <Provider store={store}>{children}</Provider>;
};
