"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface LoadingProgressProps {
    label?: string;
    className?: string;
}

export function LoadingProgress({ label = "Loading...", className = "" }: LoadingProgressProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animate progress from 0 to ~85% over time
        // The last 15% happens instantly when data loads
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 85) {
                    clearInterval(interval);
                    return 85;
                }
                // Slow down as we approach 85%
                const increment = Math.max(1, (85 - prev) / 10);
                return Math.min(85, prev + increment);
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
            <Loader2 size={32} className="text-primary animate-spin mb-4" />
            <div className="text-sm text-muted-foreground mb-3">{label}</div>
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-200 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">
                {Math.round(progress)}%
            </div>
        </div>
    );
}
