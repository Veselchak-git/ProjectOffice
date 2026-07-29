import { PROJECTS } from "@helpdesk-portal/i18n";
import { Button, Checkbox, Modal, Select } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getToken } from "@/shared/lib/auth/token-store";
import { i18n } from "@/shared/lib/i18n";

import styles from "./ExportModal.module.css";
import type { ExportModalProps, ExportParams } from "./types";

function getFileName(locale: string, prefix: { ru: string; en: string }): string {
    const now = new Date();
    if (locale === "ru") {
        const d = now.toLocaleDateString("ru-RU");
        return `${prefix.ru}_${d}.xlsx`;
    }
    return `${prefix.en}_${now.toISOString().slice(0, 10)}.xlsx`;
}

export const ExportModal: FC<ExportModalProps> = ({
    isOpen,
    onClose,
    onExport,
    hasActiveFilters = false,
    hasActiveSorting = false,
    activeFiltersDescription,
    activeSortingDescription,
    availableLocales,
    columnLabelKeys,
    filterQueryString,
    sortBy,
    sortOrder,
    exportUrl,
    columnNamespace,
    fileNamePrefix = { ru: "Проекты", en: "Projects" }
}) => {
    const { t } = useTranslation(columnNamespace ?? PROJECTS);

    const [applyFilters, setApplyFilters] = useState(hasActiveFilters);
    const [applySorting, setApplySorting] = useState(hasActiveSorting);
    const [selectedLocale, setSelectedLocale] = useState(availableLocales[0] ?? "");
    const [exporting, setExporting] = useState(false);

    const handleExport = async (): Promise<void> => {
        setExporting(true);
        try {
            const token = getToken();
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Резолвим заголовки с учётом выбранной локали экспорта
            const exportT = i18n.getFixedT(selectedLocale, columnNamespace ?? PROJECTS);
            const resolvedHeaders: Record<string, string> = {};
            if (columnLabelKeys) {
                for (const [key, i18nKey] of Object.entries(columnLabelKeys)) {
                    resolvedHeaders[key] = exportT(i18nKey);
                }
            }

            const response = await fetch(exportUrl!, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    applyFilters,
                    applySorting,
                    locale: selectedLocale,
                    timezone: tz,
                    ...(Object.keys(resolvedHeaders).length ? { columnHeaders: resolvedHeaders } : {}),
                    ...(applyFilters && filterQueryString != null ? { filter: filterQueryString } : {}),
                    ...(applySorting && sortBy != null ? { sortBy } : {}),
                    ...(applySorting && sortOrder != null ? { sortOrder } : {})
                })
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = getFileName(selectedLocale, fileNamePrefix);
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            const params: ExportParams = {
                applyFilters,
                applySorting,
                locale: selectedLocale,
                ...(applyFilters && filterQueryString != null ? { filterQueryString } : {}),
                ...(applySorting && sortBy != null ? { sortBy } : {}),
                ...(applySorting && sortOrder != null ? { sortOrder } : {})
            };
            onExport(params);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Export failed";
            alert(t("exportModal.error") || message);
        } finally {
            setExporting(false);
        }
    };

    const localeOptions = availableLocales.map(l => ({
        value: l,
        label: t(`exportModal.locale.${l}`)
    }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("exportModal.title")} size="m">
            <div className={styles["section-label"]}>{t("exportModal.exportParamsLabel")}</div>
            <div className={styles["checkbox-row"]}>
                <label className={styles["checkbox-label"]}>
                    <Checkbox
                        defaultChecked={hasActiveFilters}
                        onCheckedChange={setApplyFilters}
                        disabled={exporting}
                    />
                    <span>{t("exportModal.applyFilters")}</span>
                </label>
                {activeFiltersDescription && (
                    <span className={styles["checkbox-hint"]}>
                        {t("exportModal.activePrefix")} {activeFiltersDescription}
                    </span>
                )}
            </div>
            <div className={styles["checkbox-row"]}>
                <label className={styles["checkbox-label"]}>
                    <Checkbox
                        defaultChecked={hasActiveSorting}
                        onCheckedChange={setApplySorting}
                        disabled={exporting}
                    />
                    <span>{t("exportModal.applySorting")}</span>
                </label>
                {activeSortingDescription && (
                    <span className={styles["checkbox-hint"]}>
                        {t("exportModal.activePrefix")} {activeSortingDescription}
                    </span>
                )}
            </div>

            <div className={styles["section-label"]}>{t("exportModal.exportLanguageLabel")}</div>
            <Select
                options={localeOptions}
                value={selectedLocale}
                onValueChange={setSelectedLocale}
                usePortal={false}
                disabled={exporting}
            />

            <div className={styles["modal-actions"]}>
                <Button variant="stroke" onClick={onClose} disabled={exporting}>
                    {t("exportModal.cancel")}
                </Button>
                <Button className={styles["confirm-btn"]} onClick={handleExport} disabled={exporting}>
                    {exporting ? t("exportModal.exporting") || "Экспорт…" : t("exportModal.confirm")}
                </Button>
            </div>
        </Modal>
    );
};
