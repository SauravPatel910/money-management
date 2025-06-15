import BalanceCard from "../components/accounts/BalanceCard";
import AccountManager from "../components/accounts/AccountManager";
import { useAppData } from "../hooks/useAppData";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import PageLayout from "../components/UI/PageLayout";

function Accounts() {
  const { status, error } = useAppData();

  // Show loading state
  status === "loading" && <Loading text="Loading account information..." />;
  status === "failed" && (
    <Failed
      error={error}
      text="Failed to load account information. Please try again later."
    />
  );

  return (
    <PageLayout
      title="Account Management"
      headerLinks={getNavigationLinks("accounts")}
      loadingText="Loading account information..."
      showBalanceCard={true}
      BalanceCardComponent={BalanceCard}
    >
      <div className="mt-8">
        <AccountManager />
      </div>
    </PageLayout>
  );
}

export default Accounts;
