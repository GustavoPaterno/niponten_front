"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { Alert, Snackbar } from "@mui/material";

type ToastSeverity = "success" | "error";

interface ToastState {
    open: boolean;
    message: string;
    severity: ToastSeverity;
}

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState>({
        open: false,
        message: "",
        severity: "success",
    });

    const show = useCallback((message: string, severity: ToastSeverity) => {
        setToast({ open: true, message, severity });
    }, []);

    const value = useMemo<ToastContextValue>(
        () => ({
            success: (message) => show(message, "success"),
            error: (message) => show(message, "error"),
        }),
        [show]
    );

    const handleClose = (_event?: unknown, reason?: string) => {
        if (reason === "clickaway") {
            return;
        }

        setToast((current) => ({ ...current, open: false }));
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            <Snackbar
                open={toast.open}
                autoHideDuration={toast.severity === "error" ? 7000 : 4000}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleClose}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast deve ser usado dentro de <ToastProvider>.");
    }

    return context;
}
