export const getNavigationLinks = (currentPage) => {
  const allLinks = {
    dashboard: { to: "/", text: "Dashboard" },
    accounts: { to: "/accounts", text: "Manage Accounts" },
    transactions: { to: "/transactions", text: "Transaction History" },
  };

  // Return all links except the current page
  return Object.entries(allLinks)
    .filter(([key]) => key !== currentPage)
    .map(([, link]) => link);
};
