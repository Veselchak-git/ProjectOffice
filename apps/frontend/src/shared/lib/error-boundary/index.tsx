/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Component, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    override render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                        <h2>Something went wrong</h2>
                        <p>{this.state.error?.message}</p>
                        <button onClick={() => this.setState({ hasError: false, error: null })}>Try again</button>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}
