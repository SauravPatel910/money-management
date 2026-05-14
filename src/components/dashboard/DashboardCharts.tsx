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
  income: "#16dbcc",
  expense: "#ff82ac",
  transfer: "#1814f3",
  person: "#ffbb38",
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
    <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,730px)_minmax(320px,1fr)]">
      <ChartPanel title="Weekly Activity" wide>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryBreakdown}>
            <CartesianGrid vertical={false} stroke="#f3f3f5" />
            <XAxis
              dataKey="categoryName"
              tick={{ fontSize: 12, fill: "#718ebf" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => `${Number(value) / 1000}k`}
              tick={{ fontSize: 12, fill: "#718ebf" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={moneyTooltipFormatter} />
            <Legend iconType="circle" />
            <Bar dataKey="income" name="Deposit" fill="#1814f3" radius={[30, 30, 30, 30]} barSize={15} />
            <Bar dataKey="expense" name="Withdraw" fill="#16dbcc" radius={[30, 30, 30, 30]} barSize={15} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Expense Statistics">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={typeMix.filter((item) => item.count > 0)}
              dataKey="amount"
              nameKey="label"
              outerRadius={96}
              paddingAngle={2}
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

      <ChartPanel title="Balance Trend">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={balanceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfeaf2" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#718ebf" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => `${Number(value) / 1000}k`}
              tick={{ fontSize: 12, fill: "#718ebf" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={moneyTooltipFormatter} />
            <Line
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke="#1814f3"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Monthly Cashflow">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyCashflow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfeaf2" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#718ebf" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => `${Number(value) / 1000}k`}
              tick={{ fontSize: 12, fill: "#718ebf" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={moneyTooltipFormatter} />
            <Legend />
            <Area type="monotone" dataKey="income" name="Income" stroke="#16dbcc" fill="#dcfaf8" />
            <Area type="monotone" dataKey="expense" name="Expense" stroke="#ff82ac" fill="#ffe0eb" />
            <Area type="monotone" dataKey="net" name="Net" stroke="#1814f3" fill="#e7edff" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
};

const ChartPanel = ({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) => (
  <div className={wide ? "xl:col-span-1" : ""}>
    <h3 className="mb-4 text-[22px] font-semibold text-[#343c6a]">{title}</h3>
    <div className="rounded-[25px] bg-white p-6">
    {children}
    </div>
  </div>
);

export default memo(DashboardCharts);
