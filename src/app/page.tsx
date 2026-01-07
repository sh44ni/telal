"use client";

import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { StatCard, Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { useAppStore } from "@/stores/useAppStore";
import {
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  Home,
  Receipt,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import Link from "next/link";

// Mock data for charts
const revenueData = [
  { month: "Jan", revenue: 450000, expenses: 280000 },
  { month: "Feb", revenue: 520000, expenses: 310000 },
  { month: "Mar", revenue: 480000, expenses: 290000 },
  { month: "Apr", revenue: 610000, expenses: 340000 },
  { month: "May", revenue: 580000, expenses: 320000 },
  { month: "Jun", revenue: 720000, expenses: 380000 },
  { month: "Jul", revenue: 690000, expenses: 360000 },
  { month: "Aug", revenue: 780000, expenses: 410000 },
  { month: "Sep", revenue: 850000, expenses: 450000 },
  { month: "Oct", revenue: 920000, expenses: 480000 },
  { month: "Nov", revenue: 880000, expenses: 460000 },
  { month: "Dec", revenue: 950000, expenses: 500000 },
];

const recentActivities = [
  { id: 1, type: "payment", message: "Rent payment received from Ahmed Al Rashid", time: "2 hours ago" },
  { id: 2, type: "contract", message: "New rental contract signed - Office 301", time: "5 hours ago" },
  { id: 3, type: "property", message: "Property listed - Palm Villa 5", time: "1 day ago" },
  { id: 4, type: "alert", message: "Overdue payment - Mohammed Hassan", time: "2 days ago" },
  { id: 5, type: "customer", message: "New lead added - Fatima Al Maktoum", time: "3 days ago" },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const { language } = useAppStore();
  const isRTL = language === "ar";

  // Translated fees data
  const feesData = [
    { name: isRTL ? "إيجار" : "Rent", value: 65 },
    { name: isRTL ? "مبيعات" : "Sales", value: 20 },
    { name: isRTL ? "صيانة" : "Maintenance", value: 10 },
    { name: isRTL ? "أخرى" : "Other", value: 5 },
  ];

  // Translated quick actions
  const quickActions = [
    { label: t("properties.addProperty"), href: "/properties", icon: Building2 },
    { label: t("rentals.addRental"), href: "/rentals", icon: Home },
    { label: t("receipts.generateReceipt"), href: "/receipts", icon: Receipt },
    { label: t("contracts.addContract"), href: "/contracts", icon: FileText },
  ];

  return (
    <PageContainer
      title={t("dashboard.welcome")}
      subtitle="Telal Al-Bidaya Real Estate"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          title={t("dashboard.totalProperties")}
          value="124"
          change={12.5}
          trend="up"
          icon={<Building2 size={24} />}
        />
        <StatCard
          title={t("dashboard.totalRevenue")}
          value="OMR 8.5M"
          change={8.2}
          trend="up"
          icon={<DollarSign size={24} />}
        />
        <StatCard
          title={t("dashboard.activeCustomers")}
          value="86"
          change={5.4}
          trend="up"
          icon={<Users size={24} />}
        />
        <StatCard
          title={t("dashboard.monthlyRevenue")}
          value="OMR 950K"
          change={-2.1}
          trend="down"
          icon={<TrendingUp size={24} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.analytics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    fontSize={11}
                    tick={{ fill: '#6b7280' }}
                    reversed={isRTL}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tickFormatter={(v) => `${v / 1000}K`}
                    width={50}
                    tick={{ fill: '#6b7280' }}
                    orientation={isRTL ? "right" : "left"}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 0,
                    }}
                    formatter={(value) => [`OMR ${Number(value).toLocaleString()}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#cea26e"
                    fill="#cea26e"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#605c53"
                    fill="#605c53"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fees Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.feesSummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feesData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={11}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#6b7280"
                    fontSize={11}
                    width={70}
                    tick={{ fill: '#6b7280' }}
                    orientation={isRTL ? "right" : "left"}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 0,
                    }}
                    formatter={(value) => [`${value}%`, isRTL ? "الحصة" : "Share"]}
                  />
                  <Bar dataKey="value" fill="#cea26e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.occupancyRate")}</span>
                <span className="font-semibold text-success">87%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.pendingPayments")}</span>
                <span className="font-semibold text-destructive">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-3 sm:p-4 border border-border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <action.icon size={24} className="text-primary" />
                    <span className="text-xs sm:text-sm font-medium text-center">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("dashboard.recentActivities")}</CardTitle>
            <Button variant="ghost" size="sm">
              {t("common.view")} {t("common.all")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className={`p-2 ${activity.type === "alert" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    {activity.type === "payment" && <DollarSign size={16} />}
                    {activity.type === "contract" && <FileText size={16} />}
                    {activity.type === "property" && <Building2 size={16} />}
                    {activity.type === "alert" && <AlertCircle size={16} />}
                    {activity.type === "customer" && <Users size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
