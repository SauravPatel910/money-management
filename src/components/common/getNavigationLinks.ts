import type { FeatureKey } from "@/lib/featureFlags";

type NavigationPage =
  | "dashboard"
  | "accounts"
  | "transactions"
  | "categories"
  | "reports"
  | "budgets"
  | "bills";

export type NavigationLink = {
  to: string;
  text: string;
  feature: FeatureKey;
  key?: string;
};

export const getNavigationLinks = (currentPage: NavigationPage) => {
  const allLinks: Record<NavigationPage, NavigationLink> = {
    dashboard: { to: "/", text: "Dashboard", feature: "dashboard" },
    accounts: { to: "/accounts", text: "Manage Accounts", feature: "accounts" },
    categories: { to: "/categories", text: "Categories", feature: "categories" },
    transactions: {
      to: "/transactions",
      text: "Transaction History",
      feature: "transactions",
    },
    reports: { to: "/reports", text: "Reports", feature: "reports" },
    budgets: { to: "/budgets", text: "Budgets", feature: "budgets" },
    bills: { to: "/bills", text: "Bills", feature: "recurringBills" },
  };

  // Return all links except the current page
  return Object.entries(allLinks)
    .filter(([key]) => key !== currentPage)
    .map(([, link]) => link);
};
