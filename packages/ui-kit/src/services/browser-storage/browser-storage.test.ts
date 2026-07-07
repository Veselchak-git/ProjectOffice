/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { BrowserStorage } from "./browser-storage";

describe("BrowserStorage", () => {
    const storage = new BrowserStorage(localStorage);

    beforeEach(() => {
        localStorage.clear();
    });

    it("reads and writes string values", () => {
        storage.setValue("key", "value");

        expect(storage.getValue("key")).toBe("value");
    });

    it("reads and writes boolean values", () => {
        storage.setBoolean("enabled", true);

        expect(storage.getBoolean("enabled")).toBe(true);
    });

    it("reads and writes array values", () => {
        storage.setArray("items", ["first", "second"]);

        expect(storage.getArray<string>("items")).toEqual(["first", "second"]);
    });

    it("returns null for invalid array values", () => {
        storage.setValue("items", "not-json");

        expect(storage.getArray("items")).toBeNull();
    });
});
