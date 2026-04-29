"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import reduxStore from "@/config/reduxStore";
import Layout from "@/components/layout/Layout";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={reduxStore}>
        <Layout>{children}</Layout>
      </Provider>
    </SessionProvider>
  );
}
