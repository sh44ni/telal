"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <input
                id={id}
                ref={ref}
                className={cn(
                    "flex h-11 sm:h-10 w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive focus:ring-destructive",
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
);
Input.displayName = "Input";

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, ...props }, ref) => (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <textarea
                id={id}
                ref={ref}
                className={cn(
                    "flex min-h-[80px] w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive focus:ring-destructive",
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
);
Textarea.displayName = "Textarea";

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, id, options, placeholder, ...props }, ref) => (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <select
                id={id}
                ref={ref}
                className={cn(
                    "flex h-10 w-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive focus:ring-destructive",
                    className
                )}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
);
Select.displayName = "Select";

// Badge
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "success" | "warning" | "danger" | "secondary";
}

const badgeVariants = {
    default: "bg-primary text-primary-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    danger: "bg-destructive text-destructive-foreground",
    secondary: "bg-muted text-muted-foreground",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 text-xs font-medium",
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    );
}

// Loading Spinner
export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
    return (
        <svg
            className={cn("animate-spin text-primary", className)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            width={size}
            height={size}
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

// Empty State
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
            <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
            )}
            {action}
        </div>
    );
}

// Stat Card
interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, change, icon, trend }: StatCardProps) {
    return (
        <div className="bg-card border border-border p-6 shadow-card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">{title}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    {change !== undefined && (
                        <p
                            className={cn(
                                "text-sm mt-1",
                                trend === "up" && "text-success",
                                trend === "down" && "text-destructive",
                                trend === "neutral" && "text-muted-foreground"
                            )}
                        >
                            {change > 0 ? "+" : ""}
                            {change}%
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="p-3 bg-primary/10 text-primary">{icon}</div>
                )}
            </div>
        </div>
    );
}

// Tabs
interface Tab {
    id: string;
    label: string;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="flex border-b border-border min-w-max">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                            activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span
                                className={cn(
                                    "ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs",
                                    activeTab === tab.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
