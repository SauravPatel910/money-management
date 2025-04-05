import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { lazy } from "react";
import Layout, { LoadingComponent } from "./components/Layout";

// Use lazy loading for better performance
const HomePage = lazy(() => import("./pages/HomePage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const TransactionHistoryPage = lazy(
  () => import("./pages/TransactionHistoryPage"),
);

// Define the root route
const rootRoute = createRootRoute({
  component: Layout,
});

// Define child routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: AccountPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: TransactionHistoryPage,
});

// Create router instance
const routeTree = rootRoute.addChildren([
  indexRoute,
  accountsRoute,
  transactionsRoute,
]);

export const router = createRouter({ routeTree });
