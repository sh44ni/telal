import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const data = readData();
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "all";

        // Calculate date range based on period
        const now = new Date();
        let startDate: Date | null = null;

        switch (period) {
            case "this_week":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                startDate.setHours(0, 0, 0, 0);
                break;
            case "this_month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case "this_year":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case "all":
            default:
                startDate = null;
                break;
        }

        // Filter transactions by date range
        const transactions = (data.receipts || []).filter(t => {
            if (!startDate) return true;
            const txDate = new Date(t.date);
            return txDate >= startDate && txDate <= now;
        });

        // Calculate financial metrics
        let revenue = 0;
        let expenses = 0;

        transactions.forEach(t => {
            // Check if it's a Transaction (has category) or Receipt (legacy)
            if ('category' in t) {
                if (t.category === "income") {
                    revenue += t.amount || 0;
                } else if (t.category === "expense") {
                    expenses += t.amount || 0;
                }
            } else {
                // Legacy receipts are income
                revenue += t.amount || 0;
            }
        });

        const netIncome = revenue - expenses;

        // Calculate properties stats
        const properties = data.properties || [];
        const propertiesStats = {
            total: properties.length,
            available: properties.filter(p => p.status === "available").length,
            rented: properties.filter(p => p.status === "rented").length,
            sold: properties.filter(p => p.status === "sold").length,
            underMaintenance: properties.filter(p => p.status === "under_maintenance").length,
        };

        // Calculate rentals stats
        const rentals = data.rentals || [];
        const rentalsStats = {
            total: rentals.length,
            paid: rentals.filter(r => r.paymentStatus === "paid").length,
            overdue: rentals.filter(r => r.paymentStatus === "overdue").length,
            unpaid: rentals.filter(r => r.paymentStatus === "unpaid").length,
            partiallyPaid: rentals.filter(r => r.paymentStatus === "partially_paid").length,
        };

        // Calculate previous period for comparison (same duration before start date)
        let prevRevenue = 0;
        let prevExpenses = 0;

        if (startDate) {
            const periodDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - periodDays);

            const prevTransactions = (data.receipts || []).filter(t => {
                const txDate = new Date(t.date);
                return txDate >= prevStartDate && txDate < startDate;
            });

            prevTransactions.forEach(t => {
                if ('category' in t) {
                    if (t.category === "income") {
                        prevRevenue += t.amount || 0;
                    } else if (t.category === "expense") {
                        prevExpenses += t.amount || 0;
                    }
                } else {
                    prevRevenue += t.amount || 0;
                }
            });
        }

        // Calculate percentage changes
        const revenueChange = prevRevenue > 0
            ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
            : 0;
        const expenseChange = prevExpenses > 0
            ? Math.round(((expenses - prevExpenses) / prevExpenses) * 100)
            : 0;

        return NextResponse.json({
            financial: {
                revenue,
                expenses,
                netIncome,
                revenueChange,
                expenseChange,
            },
            properties: propertiesStats,
            rentals: rentalsStats,
            period,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
