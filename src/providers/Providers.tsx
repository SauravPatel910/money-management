"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import queryClient from "@/config/queryClient";
import reduxStore from "@/config/reduxStore";
import Layout from "@/components/layout/Layout";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={reduxStore}>
      <QueryClientProvider client={queryClient}>
        <Layout>{children}</Layout>
      </QueryClientProvider>
    </Provider>
  );
}
