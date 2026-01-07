"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";
import { Menu, Globe, Bell, Search, User, LogOut, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";

export function Header() {
    const { t, i18n } = useTranslation();
    const { language, setLanguage, setSidebarOpen, sidebarCollapsed, direction } = useAppStore();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const toggleLanguage = () => {
        const newLang = language === "en" ? "ar" : "en";
        setLanguage(newLang);
        i18n.changeLanguage(newLang);
        document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = newLang;
    };

    const handleLogout = () => {
        // Clear any stored state if needed
        localStorage.clear();
        window.location.href = "/";
    };

    // Calculate sidebar width
    const sidebarWidth = sidebarCollapsed ? "70px" : "260px";

    return (
        <header
            className={cn(
                "fixed top-0 h-[70px] bg-card border-b border-border z-30 transition-all duration-300 flex items-center justify-between px-3 sm:px-6",
                "max-md:left-0 max-md:right-0"
            )}
            style={{
                // In RTL: sidebar is on right, so we set right margin
                // In LTR: sidebar is on left, so we set left margin
                ...(direction === "rtl"
                    ? { left: 0, right: sidebarWidth }
                    : { left: sidebarWidth, right: 0 }
                ),
            }}
        >
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2.5 hover:bg-muted transition-colors touch-target"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>

                {/* Search - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2 bg-muted px-3 py-2 w-[300px]">
                    <Search size={18} className="text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t("common.search")}
                        className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-sm font-medium"
                    title={t("settings.language")}
                >
                    <Globe size={18} />
                    <span className="hidden sm:inline">{language === "en" ? "العربية" : "English"}</span>
                </button>

                {/* Notifications */}
                <button className="relative p-2 hover:bg-muted transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary" />
                </button>

                {/* User Menu */}
                <div className="relative">
                    <button
                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            <User size={18} />
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium">Admin</p>
                            <p className="text-xs text-muted-foreground">Administrator</p>
                        </div>
                        <ChevronDown size={16} className={cn("hidden sm:block transition-transform", userMenuOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setUserMenuOpen(false)}
                            />
                            {/* Menu */}
                            <div className={cn(
                                "absolute top-full mt-1 w-48 bg-card border border-border shadow-lg z-50",
                                direction === "rtl" ? "left-0" : "right-0"
                            )}>
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <Settings size={18} />
                                    <span className="text-sm">{t("settings.title")}</span>
                                </Link>
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-destructive"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={18} />
                                    <span className="text-sm">{t("common.logout")}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
