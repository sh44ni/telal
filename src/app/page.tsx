"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { Button, Card, CardContent, Select, useToast } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Building2,
  FileText,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface DashboardData {
  financial: {
    revenue: number;
    expenses: number;
    netIncome: number;
    revenueChange: number;
    expenseChange: number;
  };
  properties: {
    total: number;
    available: number;
    rented: number;
    sold: number;
  };
  rentals: {
    total: number;
    paid: number;
    overdue: number;
    unpaid: number;
  };
  period: string;
}

const periodOptions = [
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const [period, setPeriod] = useState("this_month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleGenerateStatement = () => {
    toast.info("Generating statement...");
    // TODO: Implement statement generation
    setTimeout(() => {
      toast.success("Statement feature coming soon!");
    }, 1000);
  };

  return (
    <PageContainer
      title={t("nav.dashboard")}
      actions={
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={periodOptions}
            className="min-w-[150px]"
          />
          <Button variant="outline" onClick={handleGenerateStatement}>
            <FileText size={16} />
            Statement
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Financial Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue Card */}
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-success mt-1">
                    {loading ? "..." : formatCurrency(data?.financial.revenue || 0)}
                  </p>
                  {data && data.financial.revenueChange !== 0 && !loading && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${data.financial.revenueChange > 0 ? "text-success" : "text-destructive"}`}>
                      {data.financial.revenueChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{Math.abs(data.financial.revenueChange)}% vs last period</span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-success/10 text-success">
                  <TrendingUp size={28} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold text-destructive mt-1">
                    {loading ? "..." : formatCurrency(data?.financial.expenses || 0)}
                  </p>
                  {data && data.financial.expenseChange !== 0 && !loading && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${data.financial.expenseChange < 0 ? "text-success" : "text-destructive"}`}>
                      {data.financial.expenseChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{Math.abs(data.financial.expenseChange)}% vs last period</span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-destructive/10 text-destructive">
                  <TrendingDown size={28} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Income Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Net Income</p>
                  <p className={`text-3xl font-bold mt-1 ${(data?.financial.netIncome || 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                    {loading ? "..." : formatCurrency(data?.financial.netIncome || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Revenue - Expenses
                  </p>
                </div>
                <div className="p-3 bg-primary/10 text-primary">
                  <DollarSign size={28} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 size={20} />
              Properties
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/properties")}>
              View All <ArrowRight size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Properties */}
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push("/properties")}
            >
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-muted inline-block mb-2">
                  <Building2 size={20} className="text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{loading ? "-" : data?.properties.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>

            {/* Available */}
            <Card
              className="cursor-pointer hover:border-success/50 transition-colors"
              onClick={() => router.push("/properties?status=available")}
            >
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-success/10 inline-block mb-2">
                  <CheckCircle size={20} className="text-success" />
                </div>
                <p className="text-2xl font-bold text-success">{loading ? "-" : data?.properties.available || 0}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </CardContent>
            </Card>

            {/* Rented */}
            <Card
              className="cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => router.push("/properties?status=rented")}
            >
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-blue-500/10 inline-block mb-2">
                  <Home size={20} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-500">{loading ? "-" : data?.properties.rented || 0}</p>
                <p className="text-sm text-muted-foreground">Rented</p>
              </CardContent>
            </Card>

            {/* Sold */}
            <Card
              className="cursor-pointer hover:border-orange-500/50 transition-colors"
              onClick={() => router.push("/properties?status=sold")}
            >
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-orange-500/10 inline-block mb-2">
                  <DollarSign size={20} className="text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-500">{loading ? "-" : data?.properties.sold || 0}</p>
                <p className="text-sm text-muted-foreground">Sold</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rentals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Home size={20} />
              Rentals
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/rentals")}>
              View All <ArrowRight size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Rentals */}
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push("/rentals")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rentals</p>
                    <p className="text-2xl font-bold mt-1">{loading ? "-" : data?.rentals.total || 0}</p>
                  </div>
                  <div className="p-2 bg-muted">
                    <Home size={20} className="text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paid */}
            <Card
              className="cursor-pointer hover:border-success/50 transition-colors"
              onClick={() => router.push("/rentals?status=paid")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-2xl font-bold text-success mt-1">{loading ? "-" : data?.rentals.paid || 0}</p>
                  </div>
                  <div className="p-2 bg-success/10">
                    <CheckCircle size={20} className="text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card
              className="cursor-pointer hover:border-destructive/50 transition-colors"
              onClick={() => router.push("/rentals?status=overdue")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{loading ? "-" : data?.rentals.overdue || 0}</p>
                  </div>
                  <div className="p-2 bg-destructive/10">
                    <AlertTriangle size={20} className="text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
