type NavigationPage = "dashboard" | "accounts" | "transactions";

export type NavigationLink = {
  to: string;
  text: string;
  key?: string;
};

export const getNavigationLinks = (currentPage: NavigationPage) => {
  const allLinks: Record<NavigationPage, NavigationLink> = {
    dashboard: { to: "/", text: "Dashboard" },
    accounts: { to: "/accounts", text: "Manage Accounts" },
    transactions: { to: "/transactions", text: "Transaction History" },
  };

  // Return all links except the current page
  return Object.entries(allLinks)
    .filter(([key]) => key !== currentPage)
    .map(([, link]) => link);
};
