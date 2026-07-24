/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUDIT } from "@helpdesk-portal/i18n";
import { Modal } from "@helpdesk-portal/ui-kit";
import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AuditLog } from "@/entities/audit-log";

import { StatusBadge } from "@/shared/ui/status-badge";

import styles from "./AuditLogPage.module.css";

/* ─── JSON helpers ─── */

function parseJsonOrNull(value: string | null): Record<string, unknown> | null {
    if (value == null) return null;
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        return null;
    } catch {
        return null;
    }
}

function getStringField(obj: Record<string, unknown> | null, key: string): string | null {
    const val = obj?.[key];
    return typeof val === "string" ? val : null;
}

/* ─── Diff types & helpers ─── */

interface FieldDiff {
    field: string;
    oldValue: string;
    newValue: string;
}

function computeDiffs(oldValue: string | null, newValue: string | null): FieldDiff[] {
    const oldObj = parseJsonOrNull(oldValue);
    const newObj = parseJsonOrNull(newValue);

    if (oldObj === null && newObj === null) {
        if (oldValue === newValue) return [];
        return [{ field: "-", oldValue: oldValue ?? "\u2014", newValue: newValue ?? "\u2014" }];
    }

    const allKeys = new Set([...Object.keys(oldObj ?? {}), ...Object.keys(newObj ?? {})]);
    const diffs: FieldDiff[] = [];

    for (const key of allKeys) {
        const ov = oldObj?.[key];
        const nv = newObj?.[key];
        const oldStr = ov === undefined ? "\u2014" : JSON.stringify(ov);
        const newStr = nv === undefined ? "\u2014" : JSON.stringify(nv);
        if (oldStr !== newStr) {
            diffs.push({ field: key, oldValue: oldStr, newValue: newStr });
        }
    }
    return diffs;
}

/* ─── Small UI components ─── */

interface ModalRowProps {
    label: string;
    children: ReactNode;
}

const ModalRow: FC<ModalRowProps> = ({ label, children }) => (
    <div className={styles["audit-log-page__modal-row"]}>
        <span className={styles["audit-log-page__modal-label"]}>{label}</span>
        <span className={styles["audit-log-page__modal-value"]}>{children}</span>
    </div>
);

interface DiffRowProps {
    diff: FieldDiff;
}

const DiffRow: FC<DiffRowProps> = ({ diff }) => (
    <div className={styles["audit-log-page__modal-diff"]}>
        <span className={styles["audit-log-page__modal-diff-field"]}>{diff.field}</span>
        {diff.field === "status" ? (
            <>
                <StatusBadge status={diff.oldValue.replace(/"/g, "")} />
                <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                <StatusBadge status={diff.newValue.replace(/"/g, "")} />
            </>
        ) : diff.field === "priority" ? (
            <>
                <StatusBadge status={diff.oldValue.replace(/"/g, "")} variant="priority" />
                <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                <StatusBadge status={diff.newValue.replace(/"/g, "")} variant="priority" />
            </>
        ) : (
            <>
                <span className={styles["audit-log-page__modal-diff-old"]}>{diff.oldValue}</span>
                <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                <span className={styles["audit-log-page__modal-diff-new"]}>{diff.newValue}</span>
            </>
        )}
    </div>
);

/* ─── Badge color mapping ─── */

function getBadgeVariant(eventType: string): "create" | "delete" | "update" {
    if (eventType.includes("CREATED") || eventType.includes("ADDED")) {
        return "create";
    }
    if (eventType.includes("DELETED") || eventType.includes("REMOVED")) {
        return "delete";
    }
    return "update";
}

/* ─── Main component ─── */

interface AuditLogDetailModalProps {
    log: AuditLog;
    onClose: () => void;
}

export const AuditLogDetailModal: FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
    const { t } = useTranslation(AUDIT);

    const newData = useMemo(() => parseJsonOrNull(log.newValue), [log.newValue]);
    const oldData = useMemo(() => parseJsonOrNull(log.oldValue), [log.oldValue]);

    const diffs = useMemo(() => {
        const isCreate = log.eventType.includes("CREATED") || log.eventType.includes("ADDED");
        return isCreate ? [] : computeDiffs(log.oldValue, log.newValue);
    }, [log.eventType, log.oldValue, log.newValue]);

    const renderMetaRows = (): ReactNode => {
        switch (log.eventType) {
            case "PROJECT_CREATED":
            case "PROJECT_DELETED":
                return (
                    <ModalRow label={t("modal.project")}>
                        {getStringField(newData ?? oldData, "name") ?? "\u2014"}
                    </ModalRow>
                );

            case "ISSUE_CREATED":
            case "ISSUE_DELETED":
            case "ISSUE_UPDATED":
                return (
                    <>
                        <ModalRow label={t("modal.issue")}>
                            {getStringField(newData ?? oldData, "title") ?? "\u2014"}
                        </ModalRow>
                        <ModalRow label={t("modal.project")}>
                            {getStringField(newData ?? oldData, "projectName") ?? "\u2014"}
                        </ModalRow>
                    </>
                );

            case "MEMBER_ADDED":
                return (
                    <>
                        <ModalRow label={t("modal.login")}>{getStringField(newData, "login") ?? "\u2014"}</ModalRow>
                        <ModalRow label={t("modal.project")}>
                            {getStringField(newData, "projectName") ?? "\u2014"}
                        </ModalRow>
                        <ModalRow label={t("modal.role")}>{getStringField(newData, "role") ?? "\u2014"}</ModalRow>
                    </>
                );

            case "MEMBER_REMOVED":
                return <ModalRow label={t("modal.login")}>{getStringField(oldData, "login") ?? "\u2014"}</ModalRow>;

            case "MEMBER_UPDATED":
                return (
                    <>
                        <ModalRow label={t("modal.login")}>{getStringField(newData, "login") ?? "\u2014"}</ModalRow>
                        <ModalRow label={t("modal.project")}>
                            {getStringField(newData, "projectName") ?? "\u2014"}
                        </ModalRow>
                    </>
                );

            case "USER_CREATED":
            case "USER_DELETED":
            case "USER_UPDATED":
                return (
                    <>
                        <ModalRow label={t("modal.login")}>
                            {getStringField(newData ?? oldData, "login") ?? "\u2014"}
                        </ModalRow>
                        <ModalRow label={t("modal.role")}>
                            {getStringField(newData ?? oldData, "role") ?? "\u2014"}
                        </ModalRow>
                    </>
                );

            default:
                return null;
        }
    };

    const isCreateOrDelete =
        log.eventType.includes("CREATED") ||
        log.eventType.includes("DELETED") ||
        log.eventType.includes("ADDED") ||
        log.eventType.includes("REMOVED");

    return (
        <Modal isOpen={true} onClose={onClose} title={t("modal.title")} size="l">
            <div className={styles["audit-log-page__modal-body"]}>
                <ModalRow label={t("modal.eventType")}>
                    <span
                        className={clsx(
                            styles["audit-log-page__badge"],
                            styles[`audit-log-page__badge--${getBadgeVariant(log.eventType)}`]
                        )}
                    >
                        {log.eventType}
                    </span>
                </ModalRow>

                {renderMetaRows()}

                {!isCreateOrDelete && (
                    <div className={styles["audit-log-page__modal-diffs"]}>
                        {diffs.length === 0 ? (
                            <p className={styles["audit-log-page__modal-no-changes"]}>{t("modal.noChanges")}</p>
                        ) : (
                            <>
                                <span className={styles["audit-log-page__modal-diffs-label"]}>
                                    {t("modal.changes")}
                                </span>
                                {diffs.map(d => (
                                    <DiffRow key={d.field} diff={d} />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};
