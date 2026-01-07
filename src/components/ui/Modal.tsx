"use client";

import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full: "sm:max-w-4xl",
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
}: ModalProps) {
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            {/* Overlay */}
            <div
                className="modal-overlay fixed inset-0"
                onClick={onClose}
            />

            {/* Modal - Full screen on mobile, centered on tablet+ */}
            <div
                className={cn(
                    "relative bg-card border border-border shadow-card-lg w-full animate-in fade-in duration-200",
                    // Mobile: slide up from bottom, full width, max height
                    "max-sm:slide-in-from-bottom-4 max-sm:max-h-[90dvh] max-sm:rounded-t-lg max-sm:border-b-0",
                    // Desktop: centered with size constraints
                    "sm:zoom-in-95 sm:max-h-[85vh]",
                    sizeClasses[size]
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card z-10">
                    <div className="flex-1 min-w-0 pr-4">
                        <h2 className="text-base sm:text-lg font-semibold truncate">{title}</h2>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted transition-colors flex-shrink-0 touch-target"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90dvh-140px)] sm:max-h-[calc(85vh-160px)]">
                    {children}
                </div>

                {/* Footer - Sticky at bottom */}
                {footer && (
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 p-4 sm:p-6 border-t border-border sticky bottom-0 bg-card">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// Confirm Dialog
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "destructive" ? "destructive" : "default"}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <p className="text-muted-foreground">{message}</p>
        </Modal>
    );
}
