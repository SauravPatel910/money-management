type NavigationPage =
  | "dashboard"
  | "accounts"
  | "transactions"
  | "categories"
  | "reports";

export type NavigationLink = {
  to: string;
  text: string;
  key?: string;
};

export const getNavigationLinks = (currentPage: NavigationPage) => {
  const allLinks: Record<NavigationPage, NavigationLink> = {
    dashboard: { to: "/", text: "Dashboard" },
    accounts: { to: "/accounts", text: "Manage Accounts" },
    categories: { to: "/categories", text: "Categories" },
    transactions: { to: "/transactions", text: "Transaction History" },
    reports: { to: "/reports", text: "Reports" },
  };

  // Return all links except the current page
  return Object.entries(allLinks)
    .filter(([key]) => key !== currentPage)
    .map(([, link]) => link);
};
