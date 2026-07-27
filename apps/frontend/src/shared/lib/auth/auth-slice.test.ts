import { describe, expect, it } from "vitest";

import {
    authSlice,
    loginSuccess,
    logoutAction,
    selectAuthLoading,
    selectAuthUser,
    setLoading,
    setUser
} from "./auth-slice";
import type { AuthUser } from "./auth-slice";

const { reducer } = authSlice;

const mockUser: AuthUser = {
    id: "1",
    login: "admin",
    role: "ADMIN"
};

describe("authSlice", () => {
    describe("reducer", () => {
        it("возвращает начальное состояние при неизвестном action", () => {
            const state = reducer(undefined, { type: "@@INIT" });

            expect(state).toEqual({ user: null, loading: true });
        });

        it("setUser устанавливает пользователя", () => {
            const prev = reducer(undefined, { type: "@@INIT" });
            const next = reducer(prev, setUser(mockUser));

            expect(next.user).toEqual(mockUser);
            expect(next.loading).toBe(true);
        });

        it("setUser очищает пользователя при null", () => {
            const prev = reducer(undefined, setUser(mockUser));
            const next = reducer(prev, setUser(null));

            expect(next.user).toBeNull();
        });

        it("setLoading меняет флаг loading", () => {
            const prev = reducer(undefined, { type: "@@INIT" });
            const next = reducer(prev, setLoading(false));

            expect(next.loading).toBe(false);
        });

        it("loginSuccess устанавливает пользователя и выключает loading", () => {
            const prev = reducer(undefined, { type: "@@INIT" });
            const next = reducer(prev, loginSuccess({ user: mockUser }));

            expect(next.user).toEqual(mockUser);
            expect(next.loading).toBe(false);
        });

        it("logoutAction очищает пользователя и выключает loading", () => {
            const prev = reducer(undefined, loginSuccess({ user: mockUser }));
            const next = reducer(prev, logoutAction());

            expect(next.user).toBeNull();
            expect(next.loading).toBe(false);
        });
    });

    describe("selectors", () => {
        it("selectAuthUser возвращает user из состояния", () => {
            const state = { auth: { user: mockUser, loading: false } };

            expect(selectAuthUser(state)).toEqual(mockUser);
        });

        it("selectAuthUser возвращает null когда user не задан", () => {
            const state = { auth: { user: null, loading: true } };

            expect(selectAuthUser(state)).toBeNull();
        });

        it("selectAuthLoading возвращает loading", () => {
            const state = { auth: { user: null, loading: true } };

            expect(selectAuthLoading(state)).toBe(true);
        });

        it("selectAuthLoading возвращает false после logoutAction", () => {
            const prev = reducer(undefined, { type: "@@INIT" });
            const afterLogin = reducer(prev, loginSuccess({ user: mockUser }));
            const afterLogout = reducer(afterLogin, logoutAction());
            const state = { auth: afterLogout };

            expect(selectAuthLoading(state)).toBe(false);
        });
    });
});
