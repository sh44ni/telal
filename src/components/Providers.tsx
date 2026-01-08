"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { useAppStore } from "@/stores/useAppStore";
import { Sidebar, Header } from "@/components/layout";
import { ToastContainer } from "@/components/ui";

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const { language, direction } = useAppStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            i18n.changeLanguage(language);
            document.documentElement.dir = direction;
            document.documentElement.lang = language;
        }
    }, [mounted, language, direction]);

    // Prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <SessionProvider>
            <I18nextProvider i18n={i18n}>
                <div dir={direction}>
                    <Sidebar />
                    <Header />
                    {children}
                    <ToastContainer />
                </div>
            </I18nextProvider>
        </SessionProvider>
    );
}
