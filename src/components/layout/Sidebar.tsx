"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FolderKanban,
    Building2,
    Users,
    Home,
    Landmark,
    FileText,
    FolderOpen,
    Settings,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

const menuItems = [
    { key: "dashboard", href: "/", icon: LayoutDashboard },
    { key: "projects", href: "/projects", icon: FolderKanban },
    { key: "properties", href: "/properties", icon: Building2 },
    { key: "customers", href: "/customers", icon: Users },
    { key: "rentals", href: "/rentals", icon: Home },
    { key: "accounts", href: "/accounts", icon: Landmark },
    { key: "contracts", href: "/contracts", icon: FileText },
    { key: "documents", href: "/documents", icon: FolderOpen },
    { key: "settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const { t } = useTranslation();
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar, sidebarOpen, direction, setSidebarOpen } = useAppStore();

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "sidebar fixed top-0 h-screen bg-sidebar-bg text-sidebar-foreground z-50 transition-all duration-300 flex flex-col",
                    sidebarCollapsed ? "w-[70px]" : "w-[260px]",
                    direction === "rtl" ? "right-0" : "left-0",
                    // Add 'open' class for mobile - this works with the CSS in globals.css
                    sidebarOpen && "open"
                )}
            >
                {/* Logo Section with mobile close button */}
                <div className={cn(
                    "h-[70px] flex items-center border-b border-white/10",
                    sidebarCollapsed ? "justify-center px-2" : "px-5 justify-between"
                )}>
                    <div className="flex items-center">
                        {sidebarCollapsed ? (
                            <img src="/favicon.svg" alt="Telal" className="w-10 h-10 object-contain" />
                        ) : (
                            <img src="/logofordarkbg.svg" alt="Telal Al-Bidaya" className="h-10 object-contain" />
                        )}
                    </div>
                    {/* Mobile close button */}
                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 hover:bg-sidebar-hover transition-colors touch-target"
                            aria-label="Close sidebar"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="space-y-1 px-3">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        onClick={() => {
                                            // Close sidebar on mobile after navigation
                                            if (window.innerWidth < 768) {
                                                setSidebarOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 md:py-2.5 transition-colors min-h-[44px] md:min-h-0",
                                            "hover:bg-sidebar-hover",
                                            isActive && "bg-sidebar-hover text-sidebar-active border-sidebar-active",
                                            isActive && (direction === "rtl" ? "border-r-2" : "border-l-2"),
                                            sidebarCollapsed && "justify-center"
                                        )}
                                        title={sidebarCollapsed ? t(`nav.${item.key}`) : undefined}
                                    >
                                        <Icon
                                            size={20}
                                            className={cn(isActive && "text-sidebar-active")}
                                        />
                                        {!sidebarCollapsed && (
                                            <span className={cn(
                                                "text-sm font-medium",
                                                isActive && "text-sidebar-active"
                                            )}>
                                                {t(`nav.${item.key}`)}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Collapse Toggle */}
                <div className="p-3 border-t border-white/10 hidden md:block">
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm hover:bg-sidebar-hover transition-colors"
                    >
                        {direction === "rtl" ? (
                            sidebarCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
                        ) : (
                            sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
                        )}
                        {!sidebarCollapsed && (
                            <span className="text-sm text-muted-foreground">
                                {t("common.collapse", "Collapse")}
                            </span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
