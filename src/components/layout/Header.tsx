"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";
import { Menu, Globe, Bell, Search, User, LogOut, Settings, ChevronDown, X, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Header() {
    const { data: session } = useSession();
    const { t, i18n } = useTranslation();
    const {
        language,
        setLanguage,
        setSidebarOpen,
        sidebarCollapsed,
        direction,
        notifications,
        removeNotification,
        clearAllNotifications,
        addNotification
    } = useAppStore();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const toggleLanguage = () => {
        const newLang = language === "en" ? "ar" : "en";
        setLanguage(newLang);
        i18n.changeLanguage(newLang);
        document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = newLang;
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    // Check for late rentals on component mount
    useEffect(() => {
        const checkLateRentals = async () => {
            try {
                const response = await fetch("/api/rentals");
                if (response.ok) {
                    const rentals = await response.json();
                    const today = new Date();

                    rentals.forEach((rental: { id: string; paymentStatus: string; paidUntil: string; tenant?: { name: string }; property?: { name: string }; monthlyRent: number }) => {
                        // Check if payment is overdue
                        if (rental.paymentStatus === "overdue" || rental.paymentStatus === "unpaid") {
                            const paidUntilDate = new Date(rental.paidUntil);
                            if (paidUntilDate < today) {
                                // Check if notification already exists for this rental
                                const existingNotification = useAppStore.getState().notifications.find(
                                    n => n.type === "rental_overdue" && n.message.includes(rental.id)
                                );

                                if (!existingNotification) {
                                    addNotification({
                                        type: "rental_overdue",
                                        title: language === "ar" ? "إيجار متأخر" : "Rental Overdue",
                                        message: language === "ar"
                                            ? `الإيجار متأخر: ${rental.tenant?.name || "مستأجر"} - ${rental.property?.name || "عقار"} (${rental.monthlyRent} ر.ع)`
                                            : `Rental overdue: ${rental.tenant?.name || "Tenant"} - ${rental.property?.name || "Property"} (OMR ${rental.monthlyRent})`,
                                        link: "/rentals"
                                    });
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to check late rentals:", error);
            }
        };

        checkLateRentals();
        // Check every 5 minutes
        const interval = setInterval(checkLateRentals, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [addNotification, language]);

    const sidebarWidth = sidebarCollapsed ? "70px" : "260px";
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header
            className={cn(
                "fixed top-0 h-[70px] bg-card border-b border-border z-30 transition-all duration-300 flex items-center justify-between px-3 sm:px-6",
                "max-md:left-0 max-md:right-0"
            )}
            style={{
                ...(direction === "rtl"
                    ? { left: 0, right: sidebarWidth }
                    : { left: sidebarWidth, right: 0 }
                ),
            }}
        >
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    className="md:hidden p-2.5 hover:bg-muted transition-colors touch-target"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>

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
                <div className="relative">
                    <button
                        className="relative p-2 hover:bg-muted transition-colors"
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                    >
                        <Bell size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium px-1">
                                {unreadCount || notifications.length}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {notificationsOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setNotificationsOpen(false)}
                            />
                            <div className={cn(
                                "absolute top-full mt-1 w-80 sm:w-96 bg-card border border-border shadow-lg z-50 max-h-[400px] overflow-hidden flex flex-col",
                                direction === "rtl" ? "left-0" : "right-0"
                            )}>
                                {/* Header */}
                                <div className="flex items-center justify-between p-3 border-b border-border">
                                    <h3 className="font-semibold text-sm">{t("common.notifications", "Notifications")}</h3>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearAllNotifications}
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            {t("common.clearAll", "Clear all")}
                                        </button>
                                    )}
                                </div>

                                {/* Notifications List */}
                                <div className="flex-1 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-muted-foreground">
                                            <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">{t("common.noNotifications", "No notifications")}</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "p-3 border-b border-border hover:bg-muted/50 transition-colors",
                                                    !notification.read && "bg-primary/5"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={cn(
                                                        "p-2 flex-shrink-0",
                                                        notification.type === "rental_overdue" && "bg-destructive/10 text-destructive"
                                                    )}>
                                                        <AlertTriangle size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">{notification.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {notification.link && (
                                                                <Link
                                                                    href={notification.link}
                                                                    onClick={() => setNotificationsOpen(false)}
                                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                    {t("common.viewDetails", "View details")}
                                                                </Link>
                                                            )}
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(notification.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeNotification(notification.id)}
                                                        className="p-1 hover:bg-muted transition-colors flex-shrink-0"
                                                        aria-label="Delete notification"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer with View All Rentals button */}
                                {notifications.length > 0 && (
                                    <div className="p-3 border-t border-border">
                                        <Link
                                            href="/rentals"
                                            onClick={() => setNotificationsOpen(false)}
                                            className="block w-full py-2 text-center text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                                        >
                                            {t("common.viewAllRentals", "View All Rentals")}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <User size={18} />}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground">{(session?.user as any)?.role || "User"}</p>
                        </div>
                        <ChevronDown size={16} className={cn("hidden sm:block transition-transform", userMenuOpen && "rotate-180")} />
                    </button>

                    {userMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setUserMenuOpen(false)}
                            />
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
