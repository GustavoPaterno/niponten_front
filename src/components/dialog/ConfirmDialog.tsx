"use client";

import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";

import Button, { ButtonColor } from "@/src/components/button/Button";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    children?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    children,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onCancel}
            fullWidth
            maxWidth="xs"
        >
            <DialogTitle>{title}</DialogTitle>

            {children && (
                <DialogContent>
                    <div
                        className="text-sm text-gray-700"
                        style={{ overflowWrap: "anywhere" }}
                    >
                        {children}
                    </div>
                </DialogContent>
            )}

            <DialogActions className="px-6 pb-5">
                <Button
                    text={cancelText}
                    color={ButtonColor.Secondary}
                    onClick={loading ? () => undefined : onCancel}
                />

                <Button
                    text={loading ? "Aguarde..." : confirmText}
                    color={danger ? ButtonColor.Danger : ButtonColor.Green}
                    onClick={loading ? () => undefined : onConfirm}
                />
            </DialogActions>
        </Dialog>
    );
}
