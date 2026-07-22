/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { AUDIT } from "@helpdesk-portal/i18n";
import { Modal } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { AuditLog } from "@/entities/audit-log";

import { StatusBadge } from "@/shared/ui/status-badge";

import styles from "./AuditLogPage.module.css";

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

interface FieldDiff {
    field: string;
    oldValue: string;
    newValue: string;
}

function isCreateEvent(eventType: string): boolean {
    return eventType.includes("CREATED") || eventType.includes("ADDED");
}

function computeDiffs(oldValue: string | null, newValue: string | null): FieldDiff[] {
    const oldObj = parseJsonOrNull(oldValue);
    const newObj = parseJsonOrNull(newValue);

    // If neither is a valid JSON object, fall back to simple comparison
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

interface AuditLogDetailModalProps {
    log: AuditLog;
    onClose: () => void;
}

export const AuditLogDetailModal: FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
    const { t } = useTranslation(AUDIT);

    const memberLogin = (() => {
        if (log.eventType === "MEMBER_ADDED") {
            const data = parseJsonOrNull(log.newValue);
            return data?.login as string | undefined;
        }
        if (log.eventType === "MEMBER_REMOVED") {
            const data = parseJsonOrNull(log.oldValue);
            return data?.login as string | undefined;
        }
        if (log.eventType === "MEMBER_UPDATED") {
            const data = parseJsonOrNull(log.newValue);
            return data?.login as string | undefined;
        }
        return undefined;
    })();

    const projectName = (() => {
        if (log.eventType === "MEMBER_UPDATED") {
            const data = parseJsonOrNull(log.newValue);
            return data?.projectName as string | undefined;
        }
        return undefined;
    })();

    const createEv = isCreateEvent(log.eventType);
    const diffs = createEv ? [] : computeDiffs(log.oldValue, log.newValue);

    return (
        <Modal isOpen={true} onClose={onClose} title={t("modal.title")} size="l">
            <div className={styles["audit-log-page__modal-body"]}>
                <div className={styles["audit-log-page__modal-row"]}>
                    <span className={styles["audit-log-page__modal-label"]}>{t("modal.eventType")}</span>
                    <span className={styles["audit-log-page__modal-value"]}>{log.eventType}</span>
                </div>
                {log.eventType === "PROJECT_CREATED" &&
                    (() => {
                        const data = parseJsonOrNull(log.newValue);
                        return (
                            <p className={styles["audit-log-page__modal-value"]}>
                                {t("modal.projectCreated", { name: (data?.name as string) ?? "—" })}
                            </p>
                        );
                    })()}
                {log.eventType === "PROJECT_DELETED" &&
                    (() => {
                        const data = parseJsonOrNull(log.oldValue);
                        return (
                            <p className={styles["audit-log-page__modal-value"]}>
                                {t("modal.projectDeleted", { name: (data?.name as string) ?? "—" })}
                            </p>
                        );
                    })()}
                {log.eventType === "ISSUE_CREATED" &&
                    (() => {
                        const data = parseJsonOrNull(log.newValue);
                        return (
                            <p className={styles["audit-log-page__modal-value"]}>
                                {t("modal.issueCreated", {
                                    projectName: (data?.projectName as string) ?? "—",
                                    title: (data?.title as string) ?? "—"
                                })}
                            </p>
                        );
                    })()}
                {log.eventType === "ISSUE_DELETED" &&
                    (() => {
                        const data = parseJsonOrNull(log.oldValue);
                        return (
                            <p className={styles["audit-log-page__modal-value"]}>
                                {t("modal.issueDeleted", {
                                    projectName: (data?.projectName as string) ?? "—",
                                    title: (data?.title as string) ?? "—"
                                })}
                            </p>
                        );
                    })()}
                {log.eventType === "MEMBER_ADDED" &&
                    (() => {
                        const data = parseJsonOrNull(log.newValue);
                        return (
                            <p className={styles["audit-log-page__modal-value"]}>
                                {t("modal.memberAdded", {
                                    login: memberLogin ?? "—",
                                    projectName: (data?.projectName as string) ?? "—",
                                    role: (data?.role as string) ?? "—"
                                })}
                            </p>
                        );
                    })()}
                {log.eventType === "MEMBER_REMOVED" && (
                    <p className={styles["audit-log-page__modal-value"]}>
                        {t("modal.memberRemoved", { login: memberLogin ?? "—" })}
                    </p>
                )}
                {log.eventType === "MEMBER_UPDATED" && (
                    <p className={styles["audit-log-page__modal-value"]}>
                        {t("modal.memberUpdated", { projectName: projectName ?? "—", login: memberLogin ?? "—" })}
                    </p>
                )}
                {log.eventType === "ISSUE_UPDATED" &&
                    (() => {
                        const data = parseJsonOrNull(log.newValue);
                        return (
                            <>
                                <p className={styles["audit-log-page__modal-value"]}>
                                    {t("modal.issueUpdated", { title: (data?.title as string) ?? "—" })}
                                </p>
                                {diffs.map(d => (
                                    <div key={d.field} className={styles["audit-log-page__modal-diff"]}>
                                        <span className={styles["audit-log-page__modal-diff-field"]}>{d.field}</span>
                                        {d.field === "status" ? (
                                            <>
                                                <StatusBadge status={d.oldValue.replace(/"/g, "")} />
                                                <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                                                <StatusBadge status={d.newValue.replace(/"/g, "")} />
                                            </>
                                        ) : d.field === "priority" ? (
                                            <>
                                                <StatusBadge status={d.oldValue.replace(/"/g, "")} variant="priority" />
                                                <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                                                <StatusBadge status={d.newValue.replace(/"/g, "")} variant="priority" />
                                            </>
                                        ) : (
                                            <>
                                                <span className={styles["audit-log-page__modal-diff-old"]}>
                                                    {d.oldValue}
                                                </span>
                                                <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                                                <span className={styles["audit-log-page__modal-diff-new"]}>
                                                    {d.newValue}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </>
                        );
                    })()}
                {log.eventType !== "MEMBER_ADDED" &&
                    log.eventType !== "MEMBER_REMOVED" &&
                    log.eventType !== "PROJECT_CREATED" &&
                    log.eventType !== "PROJECT_DELETED" &&
                    log.eventType !== "ISSUE_CREATED" &&
                    log.eventType !== "ISSUE_DELETED" &&
                    log.eventType !== "ISSUE_UPDATED" &&
                    (diffs.length === 0 ? (
                        <p className={styles["audit-log-page__modal-value"]}>{t("modal.noChanges")}</p>
                    ) : (
                        diffs.map(d => (
                            <div key={d.field} className={styles["audit-log-page__modal-diff"]}>
                                <span className={styles["audit-log-page__modal-diff-field"]}>{d.field}</span>
                                {d.field === "status" ? (
                                    <>
                                        <StatusBadge status={d.oldValue.replace(/"/g, "")} />
                                        <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                                        <StatusBadge status={d.newValue.replace(/"/g, "")} />
                                    </>
                                ) : d.field === "priority" ? (
                                    <>
                                        <StatusBadge status={d.oldValue.replace(/"/g, "")} variant="priority" />
                                        <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                                        <StatusBadge status={d.newValue.replace(/"/g, "")} variant="priority" />
                                    </>
                                ) : (
                                    <>
                                        <span className={styles["audit-log-page__modal-diff-old"]}>{d.oldValue}</span>
                                        <span className={styles["audit-log-page__modal-diff-arrow"]}>→</span>
                                        <span className={styles["audit-log-page__modal-diff-new"]}>{d.newValue}</span>
                                    </>
                                )}
                            </div>
                        ))
                    ))}
            </div>
        </Modal>
    );
};
