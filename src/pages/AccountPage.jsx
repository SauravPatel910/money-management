import { Link } from "@tanstack/react-router";
import AccountManager from "../components/AccountManager";
import BalanceCard from "../components/BalanceCard";

function AccountPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-800">
          Account Management
        </h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Dashboard
          </Link>
          <Link
            to="/transactions"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Transaction History
          </Link>
        </div>
      </div>

      <BalanceCard />

      <div className="mt-8">
        <AccountManager />
      </div>
    </div>
  );
}

export default AccountPage;
