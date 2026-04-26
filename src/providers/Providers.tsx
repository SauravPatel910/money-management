"use client";

import { Provider } from "react-redux";
import reduxStore from "@/config/reduxStore";
import Layout from "@/components/layout/Layout";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={reduxStore}>
      <Layout>{children}</Layout>
    </Provider>
  );
}
