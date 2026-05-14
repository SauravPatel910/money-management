"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";
import AuthControls from "@/components/auth/AuthControls";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { FeatureKey } from "@/lib/featureFlags";

// Create a loading component
const LoadingComponent = () => (
  <div className="py-10 text-center text-sm font-medium text-[#718ebf]">
    Loading...
  </div>
);

type ShellNavItem = {
  href: string;
  label: string;
  feature: FeatureKey;
  icon: ReactNode;
};

const iconClass = "h-5 w-5";

const navItems: ShellNavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    feature: "dashboard",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 11.5 12 4l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-8Z" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    feature: "transactions",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 7h11l-3-3 1.4-1.4L21.8 8l-5.4 5.4L15 12l3-3H7V7Zm10 10H6l3 3-1.4 1.4L2.2 16l5.4-5.4L9 12l-3 3h11v2Z" />
      </svg>
    ),
  },
  {
    href: "/accounts",
    label: "Accounts",
    feature: "accounts",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      </svg>
    ),
  },
  {
    href: "/categories",
    label: "Categories",
    feature: "categories",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-11Z" />
      </svg>
    ),
  },
  {
    href: "/budgets",
    label: "Budgets",
    feature: "budgets",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4h14v16H5V4Zm3 4h8V6H8v2Zm0 4h2v-2H8v2Zm4 0h4v-2h-4v2Zm-4 4h2v-2H8v2Zm4 0h4v-2h-4v2Z" />
      </svg>
    ),
  },
  {
    href: "/bills",
    label: "Bills",
    feature: "recurringBills",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 2h10a2 2 0 0 1 2 2v18l-3-2-2 2-2-2-2 2-2-2-3 2V4a2 2 0 0 1 2-2Zm2 6h6V6H9v2Zm0 4h6v-2H9v2Zm0 4h4v-2H9v2Z" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    feature: "reports",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 20V4h14v16H5Zm3-3h2v-6H8v6Zm4 0h2V7h-2v10Zm4 0h2v-4h-2v4Z" />
      </svg>
    ),
  },
];

// Layout component with common structure
function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isEnabled } = useFeatureFlags();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const visibleNavItems = navItems.filter((item) => isEnabled(item.feature));

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] text-[#232323]">
        <main className="flex min-h-screen items-center justify-center px-5 py-10">
          <Suspense fallback={<LoadingComponent />}>{children}</Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#232323]">
      <aside className="fixed top-0 bottom-0 left-0 z-30 hidden w-62.5 border-r border-[#e6eff5] bg-white lg:block">
        <Link href="/" className="flex h-25 items-center gap-3 px-9">
          <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#2d60ff] text-[#2d60ff]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5h16v14H4V5Zm2 4h12V7H6v2Zm0 8h5v-6H6v6Zm7 0h5v-6h-5v6Z" />
            </svg>
          </span>
          <span className="text-[25px] leading-none font-bold text-[#343c6a]">
            BankDash.
          </span>
        </Link>
        <nav className="mt-8 space-y-2">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                href={item.href}
                key={item.href}
                className={`relative flex h-14.5 items-center gap-7 px-10 text-[18px] font-medium transition-colors ${
                  isActive
                    ? "text-[#2d60ff]"
                    : "text-[#b1b1b1] hover:text-[#343c6a]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 h-14.5 w-1.5 rounded-r-[10px] bg-[#2d60ff]" />
                )}
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-62.5">
        <header className="sticky top-0 z-20 border-b border-[#e6eff5] bg-white">
          <div className="flex min-h-25 flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <Link href="/" className="flex items-center gap-3 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#2d60ff] text-[#2d60ff]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4 5h16v14H4V5Zm2 4h12V7H6v2Zm0 8h5v-6H6v6Zm7 0h5v-6h-5v6Z" />
                </svg>
              </span>
              <span className="text-2xl font-bold text-[#343c6a]">
                BankDash.
              </span>
            </Link>
            <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
              <div className="relative flex-1">
                <svg
                  className="absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-[#718ebf]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  aria-label="Search"
                  className="h-12.5 w-full rounded-[40px] bg-[#f5f7fa] pr-5 pl-12 text-[15px] text-[#343c6a] outline-none placeholder:text-[#8ba3cb]"
                  placeholder="Search for something"
                />
              </div>
            </div>
            <AuthControls />
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-[#eef3f8] px-4 py-3 lg:hidden">
            {visibleNavItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-[#1814f3] text-white"
                      : "bg-white text-[#718ebf]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="min-h-[calc(100vh-100px)] px-5 py-6 sm:px-8 lg:px-10">
          <Suspense fallback={<LoadingComponent />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}

export default Layout;
export { LoadingComponent };
