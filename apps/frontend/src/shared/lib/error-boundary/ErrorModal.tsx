import { COMMON } from "@helpdesk-portal/i18n";
import ErrorIcon from "@helpdesk-portal/icons/Error.svg?react";
import { Button, Modal } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import styles from "./ErrorModal.module.css";

interface ErrorModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
    onOkNavigate?: string;
}

export const ErrorModal: FC<ErrorModalProps> = ({ isOpen, message, onClose, onOkNavigate }) => {
    const { t } = useTranslation(COMMON);
    const navigate = useNavigate();

    const handleOk = () => {
        if (onOkNavigate) {
            navigate(onOkNavigate);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("error.title")}>
            <ErrorIcon className={styles["error-modal-icon"]} />
            <p className={styles["error-modal-message"]}>{message}</p>
            <div className={styles["error-modal-button"]}>
                <Button className={styles["ok-button"]} onClick={handleOk}>
                    {t("ok")}
                </Button>
            </div>
        </Modal>
    );
};
