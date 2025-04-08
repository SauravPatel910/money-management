import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { lazy } from "react";
import Layout from "../components/layout/Layout.jsx";

// Use lazy loading for better performance
const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const Accounts = lazy(() => import("../pages/Accounts.jsx"));
const Transactions = lazy(() => import("../pages/Transactions.jsx"));

// Define the root route
const rootRoute = createRootRoute({
  component: Layout,
});

// Define child routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: Accounts,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: Transactions,
});

// Create router instance
const routeTree = rootRoute.addChildren([
  indexRoute,
  accountsRoute,
  transactionsRoute,
]);

export function getRouter() {
  return createRouter({ routeTree });
}

export const router = getRouter();
