import { NS } from "@helpdesk-portal/i18n";
import { Button } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { User } from "@/entities/user";

interface Props {
    user: User;
    onEdit: (user: User) => void;
}

export const UsersActionsCell: FC<Props> = ({ user, onEdit }) => {
    const { t } = useTranslation(NS.users);

    return (
        <div className="users-page__actions-cell">
            <Button variant="stroke" size="s" onClick={() => onEdit(user)}>
                {t("table.edit")}
            </Button>
        </div>
    );
};
