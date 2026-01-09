import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
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

        // Build where clause for date filtering
        const dateWhere = startDate ? {
            date: {
                gte: startDate,
                lte: now,
            },
        } : {};

        // Fetch transactions
        const transactions = await prisma.transaction.findMany({
            where: dateWhere,
        });

        // Calculate financial metrics
        let revenue = 0;
        let expenses = 0;

        // Group transactions by month for chart data
        const monthlyData: Record<string, { revenue: number; expenses: number }> = {};

        transactions.forEach(t => {
            const txDate = new Date(t.date);
            const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, expenses: 0 };
            }

            if (t.category === "INCOME") {
                revenue += t.amount || 0;
                monthlyData[monthKey].revenue += t.amount || 0;
            } else if (t.category === "EXPENSE") {
                expenses += t.amount || 0;
                monthlyData[monthKey].expenses += t.amount || 0;
            }
        });

        const netIncome = revenue - expenses;

        // Convert monthly data to chart format
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = Object.keys(monthlyData)
            .sort()
            .map(key => {
                const [year, month] = key.split('-');
                const monthIndex = parseInt(month) - 1;
                return {
                    month: monthNames[monthIndex],
                    revenue: monthlyData[key].revenue,
                    expenses: monthlyData[key].expenses,
                };
            });

        // Calculate properties stats
        const properties = await prisma.property.findMany();
        const propertiesStats = {
            total: properties.length,
            available: properties.filter(p => p.status === "AVAILABLE").length,
            rented: properties.filter(p => p.status === "RENTED").length,
            sold: properties.filter(p => p.status === "SOLD").length,
            underMaintenance: properties.filter(p => p.status === "UNDER_MAINTENANCE").length,
        };

        // Calculate rentals stats
        const rentals = await prisma.rental.findMany();
        const rentalsStats = {
            total: rentals.length,
            paid: rentals.filter(r => r.paymentStatus === "PAID").length,
            overdue: rentals.filter(r => r.paymentStatus === "OVERDUE").length,
            unpaid: rentals.filter(r => r.paymentStatus === "UNPAID").length,
            partiallyPaid: rentals.filter(r => r.paymentStatus === "PARTIALLY_PAID").length,
        };

        // Calculate previous period for comparison
        let prevRevenue = 0;
        let prevExpenses = 0;

        if (startDate) {
            const periodDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - periodDays);

            const prevTransactions = await prisma.transaction.findMany({
                where: {
                    date: {
                        gte: prevStartDate,
                        lt: startDate,
                    },
                },
            });

            prevTransactions.forEach(t => {
                if (t.category === "INCOME") {
                    prevRevenue += t.amount || 0;
                } else if (t.category === "EXPENSE") {
                    prevExpenses += t.amount || 0;
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
            chartData,
            properties: propertiesStats,
            rentals: rentalsStats,
            period,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
