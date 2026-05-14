import type { ReactNode } from "react";
import BalanceCard from "../accounts/BalanceCard";
import type { NavigationLink } from "../common/getNavigationLinks";

type PageLayoutProps = {
  title: string;
  headerLinks?: NavigationLink[];
  children: ReactNode;
  loadingText?: string;
  showBalanceCard?: boolean;
  BalanceCardComponent?: typeof BalanceCard;
};

const PageLayout = ({
  children,
  showBalanceCard = true,
  BalanceCardComponent = BalanceCard,
}: PageLayoutProps) => {
  return (
    <div className="mx-auto max-w-297.5">
      {showBalanceCard && <BalanceCardComponent />}
      {children}
    </div>
  );
};

export default PageLayout;
