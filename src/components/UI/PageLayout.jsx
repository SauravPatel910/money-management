import BalanceCard from "../accounts/BalanceCard";
import PageHeader from "../UI/PageHeader";

const PageLayout = ({ title, headerLinks = [], children }) => {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={title} links={headerLinks} />
      <BalanceCard />
      {children}
    </div>
  );
};

export default PageLayout;
