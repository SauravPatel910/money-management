"use client";

import { memo, useMemo } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildBalanceTrend,
  buildCategoryBreakdown,
  buildMonthlyCashflow,
  buildTransactionTypeMix,
} from "../../lib/moneyAnalytics";
import type { MoneyTransaction } from "../../types/money";
import { formatCurrency } from "../../utils/formatters";

type DashboardChartsProps = {
  transactions: MoneyTransaction[];
};

const typeColors: Record<string, string> = {
  income: "#16a34a",
  expense: "#dc2626",
  transfer: "#2563eb",
  person: "#7c3aed",
};

const moneyTooltipFormatter = (value: unknown) =>
  formatCurrency(Number(value || 0));

const DashboardCharts = ({ transactions }: DashboardChartsProps) => {
  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(transactions),
    [transactions],
  );
  const monthlyCashflow = useMemo(
    () => buildMonthlyCashflow(transactions),
    [transactions],
  );
  const balanceTrend = useMemo(
    () => buildBalanceTrend(transactions),
    [transactions],
  );
  const typeMix = useMemo(
    () =>
      buildTransactionTypeMix(transactions).map((item) => ({
        ...item,
        label: `${item.type} (${item.count})`,
      })),
    [transactions],
  );

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 grid gap-6 xl:grid-cols-2">
      <ChartPanel title="Category Breakdown">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={categoryBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="categoryName" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
            <Tooltip formatter={moneyTooltipFormatter} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#16a34a" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Monthly Cashflow">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyCashflow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
            <Tooltip formatter={moneyTooltipFormatter} />
            <Legend />
            <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" fill="#bbf7d0" />
            <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" fill="#fecaca" />
            <Area type="monotone" dataKey="net" name="Net" stroke="#2563eb" fill="#bfdbfe" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Balance Trend">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={balanceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
            <Tooltip formatter={moneyTooltipFormatter} />
            <Line
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Transaction Type Mix">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={typeMix.filter((item) => item.count > 0)}
              dataKey="amount"
              nameKey="label"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              label
            >
              {typeMix
                .filter((item) => item.count > 0)
                .map((entry) => (
                <Cell key={entry.type} fill={typeColors[entry.type]} />
              ))}
            </Pie>
            <Tooltip formatter={moneyTooltipFormatter} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
};

const ChartPanel = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-card">
    <h3 className="mb-4 text-lg font-semibold text-primary-700">{title}</h3>
    {children}
  </div>
);

export default memo(DashboardCharts);
