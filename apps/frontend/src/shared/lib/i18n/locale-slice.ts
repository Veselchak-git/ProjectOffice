import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export type Locale = "ru" | "en";

export interface LocaleState {
    currentLocale: Locale;
}

const initialState: LocaleState = {
    currentLocale: "ru"
};

export const localeSlice = createSlice({
    name: "locale",
    initialState,
    reducers: {
        setLocale(state, action: PayloadAction<Locale>) {
            state.currentLocale = action.payload;
        }
    }
});

export const { setLocale } = localeSlice.actions;
