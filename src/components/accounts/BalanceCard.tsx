import { memo } from "react";
import { useAppSelector } from "../../config/reduxStore";
import {
  selectAccounts,
  selectSummary,
  selectTotalBalance,
} from "../../store/transactionsSlice";
import type { Account } from "../../types/money";
import { formatCurrency } from "../../utils/formatters";

const AccountIcon = ({
  type,
  primary = false,
}: {
  type: "cash" | "bank";
  primary?: boolean;
}) => (
  <div
    className={`grid h-[58px] w-[58px] place-items-center rounded-full ${
      primary ? "bg-white/18 text-white" : "bg-[#f5f7fa] text-[#2d60ff]"
    }`}
  >
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      {type === "cash" ? (
        <path d="M4 7h16v10H4V7Zm2 2v6h12V9H6Zm6 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-7-3a2 2 0 0 0 2-2H5v2Zm0 2v2h2a2 2 0 0 0-2-2Zm14-2V9h-2a2 2 0 0 0 2 2Zm0 2a2 2 0 0 0-2 2h2v-2Z" />
      ) : (
        <path d="M12 3 3 7.5V10h18V7.5L12 3ZM5 11v7H3v2h18v-2h-2v-7h-3v7h-2v-7h-4v7H8v-7H5Z" />
      )}
    </svg>
  </div>
);

const getAccountTitle = (account: Account | undefined, fallback: string) => {
  if (!account) return fallback;
  if (account.id === "cash" || account.name.toLowerCase().includes("cash")) {
    return "Cash at Home";
  }
  return "Bank Account";
};

const getAccountSubtitle = (account: Account | undefined, fallback: string) =>
  account?.name || fallback;

const AccountBalanceTile = ({
  account,
  fallbackTitle,
  fallbackSubtitle,
  fallbackAmount,
  type,
  primary = false,
}: {
  account?: Account;
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackAmount: number;
  type: "cash" | "bank";
  primary?: boolean;
}) => (
  <div
    className={`min-h-[210px] rounded-[25px] p-6 ${
      primary
        ? "bg-linear-to-br from-[#4c49ed] to-[#0a06f4] text-white"
        : "border border-[#dfeaf2] bg-white text-[#343c6a]"
    }`}
  >
    <div className="flex h-full flex-col justify-between gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${primary ? "text-white/75" : "text-[#718ebf]"}`}>
            {getAccountTitle(account, fallbackTitle)}
          </p>
          <p className="mt-2 truncate text-[17px] font-semibold">
            {getAccountSubtitle(account, fallbackSubtitle)}
          </p>
        </div>
        <AccountIcon type={type} primary={primary} />
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase ${primary ? "text-white/65" : "text-[#718ebf]"}`}>
          Available Balance
        </p>
        <p className="mt-2 text-3xl font-semibold">
          {formatCurrency(account?.balance ?? fallbackAmount)}
        </p>
      </div>
      <div
        className={`rounded-[18px] px-4 py-3 text-sm font-medium ${
          primary ? "bg-white/12 text-white/85" : "bg-[#f5f7fa] text-[#718ebf]"
        }`}
      >
        {type === "cash"
          ? "Physical cash balance kept at home."
          : "Money available in your linked bank account."}
      </div>
    </div>
  </div>
);

const StatPill = ({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "income" | "expense";
}) => (
  <div className="rounded-[25px] bg-white p-5">
    <div className="flex items-center gap-4">
      <span
        className={`grid h-[55px] w-[55px] place-items-center rounded-full ${
          tone === "income"
            ? "bg-[#dcfaf8] text-[#16dbcc]"
            : "bg-[#fff5d9] text-[#ffbb38]"
        }`}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          {tone === "income" ? (
            <path d="M12 4v11.2l4.6-4.6L18 12l-6 6-6-6 1.4-1.4 4.6 4.6V4h2Z" />
          ) : (
            <path d="M12 20V8.8l-4.6 4.6L6 12l6-6 6 6-1.4 1.4L14 10.8V20h-2Z" />
          )}
        </svg>
      </span>
      <div>
        <p className="text-[15px] text-[#718ebf]">{label}</p>
        <p className="text-xl font-semibold text-[#343c6a]">
          {formatCurrency(amount)}
        </p>
      </div>
    </div>
  </div>
);

const BalanceCard = () => {
  const accounts = useAppSelector(selectAccounts);
  const totalBalance = useAppSelector(selectTotalBalance);
  const summary = useAppSelector(selectSummary);
  const cashAccount =
    accounts.find(
      (account) =>
        account.id === "cash" || account.name.toLowerCase().includes("cash"),
    ) || accounts[0];
  const bankAccount =
    accounts.find((account) => account.id !== cashAccount?.id) || accounts[1];

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[22px] font-semibold text-[#343c6a]">
          My Money Accounts
        </h2>
        <span className="text-[17px] font-semibold text-[#343c6a]">
          {accounts.length} accounts
        </span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_350px]">
        <AccountBalanceTile
          account={cashAccount}
          fallbackTitle="Cash at Home"
          fallbackSubtitle="House Cash"
          fallbackAmount={totalBalance}
          type="cash"
          primary
        />
        <AccountBalanceTile
          account={bankAccount}
          fallbackTitle="Bank Account"
          fallbackSubtitle="Primary Bank"
          fallbackAmount={0}
          type="bank"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <StatPill
            label="Total Income"
            amount={summary.totalIncome}
            tone="income"
          />
          <StatPill
            label="Total Expense"
            amount={summary.totalExpense}
            tone="expense"
          />
        </div>
      </div>
    </section>
  );
};

export default memo(BalanceCard);
