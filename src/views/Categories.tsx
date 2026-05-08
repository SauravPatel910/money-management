"use client";

import CategoryManager from "../components/categories/CategoryManager";
import FeatureDisabled from "../components/common/FeatureDisabled";
import FeatureGate from "../components/common/FeatureGate";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import Failed from "../components/UI/Failed";
import Loading from "../components/UI/Loading";
import PageLayout from "../components/UI/PageLayout";
import { useAppData } from "../hooks/useAppData";

function Categories() {
  const {
    categories,
    dispatch,
    categoriesStatus,
    categoriesError,
  } = useAppData();

  if (categoriesStatus === "idle" || categoriesStatus === "loading") {
    return <Loading />;
  }

  if (categoriesStatus === "failed") {
    return (
      <Failed
        error={categoriesError}
        text="Failed to load categories. Please try again later."
      />
    );
  }

  return (
    <FeatureGate
      feature="categories"
      fallback={<FeatureDisabled title="Categories disabled" />}
    >
      <PageLayout
        title="Categories"
        headerLinks={getNavigationLinks("categories")}
        loadingText="Loading categories..."
      >
        <CategoryManager categories={categories} dispatch={dispatch} />
      </PageLayout>
    </FeatureGate>
  );
}

export default Categories;
