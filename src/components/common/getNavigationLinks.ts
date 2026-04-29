type NavigationPage = "dashboard" | "accounts" | "transactions" | "categories";

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
  };

  // Return all links except the current page
  return Object.entries(allLinks)
    .filter(([key]) => key !== currentPage)
    .map(([, link]) => link);
};
