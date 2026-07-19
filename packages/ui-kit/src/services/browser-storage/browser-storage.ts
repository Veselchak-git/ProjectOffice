/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */

type StorageValue = string | null;

export interface IBrowserStorage {
    getValue(key: string): StorageValue;
    setValue(key: string, value: string): void;
    getBoolean(key: string): boolean | null;
    setBoolean(key: string, value: boolean): void;
    getArray<T>(key: string): T[] | null;
    setArray<T>(key: string, value: T[]): void;
    remove(key: string): void;
    reset(): void;
}

export class BrowserStorage implements IBrowserStorage {
    constructor(private readonly storage: Storage) {}

    getValue(key: string): StorageValue {
        try {
            return this.storage.getItem(key);
        } catch {
            return null;
        }
    }

    setValue(key: string, value: string): void {
        try {
            this.storage.setItem(key, value);
        } catch {
            // Silently ignore storage errors
        }
    }

    getBoolean(key: string): boolean | null {
        const value = this.getValue(key);

        if (value === null) {
            return null;
        }

        return value === "true";
    }

    setBoolean(key: string, value: boolean): void {
        this.setValue(key, String(value));
    }

    getArray<T>(key: string): T[] | null {
        const value = this.getValue(key);

        if (value === null) {
            return null;
        }

        try {
            const parsedValue: unknown = JSON.parse(value);

            return Array.isArray(parsedValue) ? (parsedValue as T[]) : null;
        } catch {
            return null;
        }
    }

    setArray<T>(key: string, value: T[]): void {
        this.setValue(key, JSON.stringify(value));
    }

    remove(key: string): void {
        try {
            this.storage.removeItem(key);
        } catch {
            // Silently ignore storage errors
        }
    }

    reset(): void {
        try {
            this.storage.clear();
        } catch {
            // Silently ignore storage errors
        }
    }

    static create(storage: Storage = localStorage): BrowserStorage | null {
        try {
            return new BrowserStorage(storage);
        } catch {
            return null;
        }
    }
}
