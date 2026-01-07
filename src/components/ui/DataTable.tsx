"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "./Button";

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    searchable?: boolean;
    searchPlaceholder?: string;
    onView?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    loading?: boolean;
    emptyMessage?: string;
    actions?: (item: T) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    keyField,
    searchable = true,
    searchPlaceholder,
    onView,
    onEdit,
    onDelete,
    loading = false,
    emptyMessage,
    actions,
}: DataTableProps<T>) {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Filter and sort data
    const processedData = useMemo(() => {
        let filtered = data;

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = data.filter((item) =>
                Object.values(item).some(
                    (value) =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchLower)
                )
            );
        }

        // Sort
        if (sortKey) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (typeof aVal === "string" && typeof bVal === "string") {
                    return sortOrder === "asc"
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }

                if (typeof aVal === "number" && typeof bVal === "number") {
                    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
                }

                return 0;
            });
        }

        return filtered;
    }, [data, search, sortKey, sortOrder]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    const hasActions = onView || onEdit || onDelete || actions;

    return (
        <div className="bg-card border border-border">
            {/* Search */}
            {searchable && (
                <div className="p-3 sm:p-4 border-b border-border">
                    <div className="flex items-center gap-2 bg-muted px-3 py-2.5 w-full sm:max-w-sm">
                        <Search size={18} className="text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder || t("common.search")}
                            className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-muted-foreground"
                        />
                    </div>
                </div>
            )}

            {/* Table - Horizontal scroll on mobile with momentum scrolling */}
            <div className="overflow-x-auto momentum-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        col.sortable && "cursor-pointer hover:bg-muted/50 select-none",
                                        col.className
                                    )}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        {col.sortable && sortKey === col.key && (
                                            sortOrder === "asc" ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            )
                                        )}
                                    </div>
                                </th>
                            ))}
                            {hasActions && (
                                <th className="w-[100px] text-center">{t("common.actions")}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            // Loading state
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {columns.map((col) => (
                                        <td key={col.key}>
                                            <div className="h-4 bg-muted animate-pulse w-3/4" />
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td>
                                            <div className="h-4 bg-muted animate-pulse w-12 mx-auto" />
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : processedData.length === 0 ? (
                            // Empty state
                            <tr>
                                <td
                                    colSpan={columns.length + (hasActions ? 1 : 0)}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    {emptyMessage || t("common.noData")}
                                </td>
                            </tr>
                        ) : (
                            // Data rows
                            processedData.map((item) => (
                                <tr key={String(item[keyField])}>
                                    {columns.map((col) => (
                                        <td key={col.key} className={col.className}>
                                            {col.render
                                                ? col.render(item)
                                                : (item[col.key] as React.ReactNode) ?? "-"}
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td>
                                            <div className="flex items-center justify-center gap-1">
                                                {actions ? (
                                                    actions(item)
                                                ) : (
                                                    <>
                                                        {onView && (
                                                            <button
                                                                onClick={() => onView(item)}
                                                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                                title={t("common.view")}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        )}
                                                        {onEdit && (
                                                            <button
                                                                onClick={() => onEdit(item)}
                                                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                                                title={t("common.edit")}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        )}
                                                        {onDelete && (
                                                            <button
                                                                onClick={() => onDelete(item)}
                                                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                                                                title={t("common.delete")}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer with count */}
            <div className="p-3 sm:p-4 border-t border-border text-xs sm:text-sm text-muted-foreground flex items-center justify-between">
                <span>
                    {t("common.showing", "Showing")} {processedData.length} {t("common.of", "of")} {data.length}
                </span>
            </div>
        </div>
    );
}
