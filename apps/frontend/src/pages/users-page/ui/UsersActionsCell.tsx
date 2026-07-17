/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { USERS } from "@helpdesk-portal/i18n";
import { Button } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { User } from "@/entities/user";

interface Props {
    user: User;
    onEdit: (user: User) => void;
}

export const UsersActionsCell: FC<Props> = ({ user, onEdit }) => {
    const { t } = useTranslation(USERS);

    return (
        <div className="users-page__actions-cell">
            <Button variant="stroke" size="s" onClick={() => onEdit(user)}>
                {t("table.edit")}
            </Button>
        </div>
    );
};
