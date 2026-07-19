import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
    id: string;
    login: string;
    role: UserRole;
}

export interface AuthState {
    user: AuthUser | null;
    loading: boolean;
}

const initialState: AuthState = {
    user: null,
    loading: true
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<AuthUser | null>) {
            state.user = action.payload;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        loginSuccess(state, action: PayloadAction<{ user: AuthUser }>) {
            state.user = action.payload.user;
            state.loading = false;
        },
        logoutAction(state) {
            state.user = null;
            state.loading = false;
        }
    }
});

export const { setUser, setLoading, loginSuccess, logoutAction } = authSlice.actions;

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
