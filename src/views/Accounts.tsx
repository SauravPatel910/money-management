"use client";

import BalanceCard from "../components/accounts/BalanceCard";
import AccountManager from "../components/accounts/AccountManager";
import { useAppData } from "../hooks/useAppData";
import FeatureDisabled from "../components/common/FeatureDisabled";
import FeatureGate from "../components/common/FeatureGate";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";
import Failed from "../components/UI/Failed";

function Accounts() {
  const { accountsStatus, accountsError } = useAppData();

  if (accountsStatus === "loading") {
    return <Loading text="Loading account information..." />;
  }

  if (accountsStatus === "failed") {
    return (
      <Failed
        error={accountsError}
        text="Failed to load account information. Please try again later."
      />
    );
  }

  return (
    <FeatureGate
      feature="accounts"
      fallback={<FeatureDisabled title="Account Management disabled" />}
    >
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
    </FeatureGate>
  );
}

export default Accounts;
