"use client";

import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

interface PageContainerProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function PageContainer({ children, title, subtitle, actions }: PageContainerProps) {
    const { sidebarCollapsed, direction } = useAppStore();

    return (
        <main className={cn(
            "main-content min-h-screen pt-[70px] transition-all duration-300 bg-background",
            direction === "rtl"
                ? (sidebarCollapsed ? "mr-[70px]" : "mr-[260px]")
                : (sidebarCollapsed ? "ml-[70px]" : "ml-[260px]"),
            "max-md:ml-0 max-md:mr-0"
        )}>
            <div className="p-4 sm:p-6">
                {(title || actions) && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-4 sm:mb-6">
                        <div className="min-w-0">
                            {title && (
                                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
                            )}
                            {subtitle && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>
                            )}
                        </div>
                        {actions && (
                            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                                {actions}
                            </div>
                        )}
                    </div>
                )}
                <div className="page-transition">
                    {children}
                </div>
            </div>
        </main>
    );
}
