import { createContext } from "react";

export interface SSEContextValue {
    isConnected: boolean;
}

export const SSEContext = createContext<SSEContextValue>({ isConnected: false });
