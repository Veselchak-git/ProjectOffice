/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { describe, it, expect } from "vitest";
import type ExcelJS from "exceljs";
import { createExportWorkbook, generateExport } from "../service.js";

describe("generateExport", () => {
    it("должен создать workbook с заголовками", async () => {
        const workbook = createExportWorkbook(
            {
                locale: "ru",
                columnHeaders: {
                    name: "Название",
                    status: "Статус",
                    createdAt: "Дата создания",
                },
            },
            [],
        );

        const sheet = workbook.getWorksheet("Проекты");
        expect(sheet).toBeDefined();

        const headerRow = sheet!.getRow(1);
        expect(headerRow.getCell(1).value).toBe("Название");
        expect(headerRow.getCell(2).value).toBe("Статус");
        expect(headerRow.getCell(3).value).toBe("Дата создания");
    });

    it("должен использовать английские имена по умолчанию", async () => {
        const workbook = createExportWorkbook({ locale: "en" }, []);

        const sheet = workbook.getWorksheet("Projects");
        expect(sheet).toBeDefined();
    });

    it("должен использовать дефолтные колонки если columnHeaders не передан", async () => {
        const workbook = createExportWorkbook({ locale: "ru" }, []);

        const sheet = workbook.getWorksheet("Проекты");
        expect(sheet!.getRow(1).getCell(1).value).toBe("id");
        expect(sheet!.getRow(1).getCell(2).value).toBe("name");
        expect(sheet!.getRow(1).getCell(3).value).toBe("description");
        expect(sheet!.getRow(1).getCell(4).value).toBe("status");
        expect(sheet!.getRow(1).getCell(5).value).toBe("versionCount");
        expect(sheet!.getRow(1).getCell(6).value).toBe("versions");
        expect(sheet!.getRow(1).getCell(7).value).toBe("taskCount");
        expect(sheet!.getRow(1).getCell(8).value).toBe("responsible");
        expect(sheet!.getRow(1).getCell(9).value).toBe("createdAt");
    });

    it("должен иметь freeze pane и autoFilter", async () => {
        const workbook = createExportWorkbook({ locale: "en" }, []);

        const sheet = workbook.getWorksheet("Projects")!;
        const view = sheet.views[0]! as ExcelJS.WorksheetViewFrozen;

        expect(view.state).toBe("frozen");
        expect(view.ySplit).toBe(1);
        expect(sheet.autoFilter).toBeDefined();
    });

    it("должен принимать параметры экспорта без columnHeaders", async () => {
        const buffer = await generateExport(
            {
                locale: "ru",
                applyFilters: true,
                applySorting: false,
                timezone: "Europe/Moscow",
            },
            [],
        );

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
    });

    it("должен добавлять строки данных в Excel", async () => {
        const mockProjects = [
            {
                id: 1,
                name: "Project Alpha",
                description: "First project",
                status: "ACTIVE",
                versionCount: 2,
                versions: [{ id: 1, version: "1.0.0" }],
                taskCount: 5,
                responsible: "Alice",
                createdAt: "2025-06-15T10:00:00.000Z",
            },
            {
                id: 2,
                name: "Project Beta",
                description: null,
                status: "ARCHIVED",
                versionCount: 0,
                versions: [],
                taskCount: 0,
                responsible: "Bob",
                createdAt: "2024-12-01T08:30:00.000Z",
            },
        ];

        const workbook = createExportWorkbook(
            {
                locale: "ru",
                columnHeaders: {
                    id: "ID",
                    name: "Название",
                    status: "Статус",
                },
            },
            mockProjects,
        );

        const sheet = workbook.getWorksheet("Проекты")!;

        // Row 2 — первый проект
        expect(sheet.getRow(2).getCell(1).value).toBe(1);
        expect(sheet.getRow(2).getCell(2).value).toBe("Project Alpha");
        expect(sheet.getRow(2).getCell(3).value).toBe("Активен");

        // Row 3 — второй проект
        expect(sheet.getRow(3).getCell(1).value).toBe(2);
        expect(sheet.getRow(3).getCell(2).value).toBe("Project Beta");
        expect(sheet.getRow(3).getCell(3).value).toBe("Архивирован");
    });

    it("с пустым массивом projects должен содержать только заголовки", async () => {
        const workbook = createExportWorkbook(
            {
                locale: "en",
                columnHeaders: { name: "Name", status: "Status" },
            },
            [],
        );

        const sheet = workbook.getWorksheet("Projects")!;
        // Только строка заголовков, второй строки нет
        expect(sheet.getRow(2).getCell(1).value).toBeFalsy();
    });

    it("с locale=ru отображает статус ACTIVE как 'Активен'", async () => {
        const mockProjects = [
            {
                id: 1,
                name: "Test",
                description: null,
                status: "ACTIVE",
                versionCount: 0,
                versions: [],
                taskCount: 0,
                responsible: "",
                createdAt: "2025-01-01T00:00:00.000Z",
            },
        ];

        const workbook = createExportWorkbook(
            {
                locale: "ru",
                columnHeaders: { status: "Статус" },
            },
            mockProjects,
        );

        const sheet = workbook.getWorksheet("Проекты")!;
        expect(sheet.getRow(2).getCell(1).value).toBe("Активен");
    });

    it("с locale=en отображает статус ACTIVE как 'Active'", async () => {
        const mockProjects = [
            {
                id: 1,
                name: "Test",
                description: null,
                status: "ACTIVE",
                versionCount: 0,
                versions: [],
                taskCount: 0,
                responsible: "",
                createdAt: "2025-01-01T00:00:00.000Z",
            },
        ];

        const workbook = createExportWorkbook(
            {
                locale: "en",
                columnHeaders: { status: "Status" },
            },
            mockProjects,
        );

        const sheet = workbook.getWorksheet("Projects")!;
        expect(sheet.getRow(2).getCell(1).value).toBe("Active");
    });
});
