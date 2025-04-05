import { memo } from "react";

const BalanceCard = ({ balance, summary }) => {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="col-span-1 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white shadow-card transition-all duration-300 hover:shadow-lg md:col-span-1">
        <div className="mb-2 text-primary-200">Current Balance</div>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">₹</span>
          <span className="ml-1 text-5xl font-bold">
            {balance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      <div className="col-span-1 flex rounded-2xl bg-gradient-to-br from-income to-income-dark p-6 text-white shadow-card transition-all duration-300 hover:shadow-lg md:col-span-1">
        <div className="mr-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <div>
          <div className="mb-2 text-income-light">Total Income</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold">₹</span>
            <span className="ml-1 text-3xl font-bold">
              {summary.totalIncome.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-1 flex rounded-2xl bg-gradient-to-br from-expense to-expense-dark p-6 text-white shadow-card transition-all duration-300 hover:shadow-lg md:col-span-1">
        <div className="mr-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </div>
        <div>
          <div className="mb-2 text-expense-light">Total Expense</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold">₹</span>
            <span className="ml-1 text-3xl font-bold">
              {summary.totalExpense.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(BalanceCard);
