import type { ReactNode } from "react";
import BalanceCard from "../accounts/BalanceCard";
import PageHeader from "../UI/PageHeader";
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
  title,
  headerLinks = [],
  children,
  showBalanceCard = true,
  BalanceCardComponent = BalanceCard,
}: PageLayoutProps) => {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={title} links={headerLinks} />
      {showBalanceCard && <BalanceCardComponent />}
      {children}
    </div>
  );
};

export default PageLayout;
