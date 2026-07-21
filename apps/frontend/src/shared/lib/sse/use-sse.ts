import { useContext } from "react";

import { SSEContext } from "@/app/providers/SSEContext";

export const useSSE = () => useContext(SSEContext);
