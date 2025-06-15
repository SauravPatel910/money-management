import { useCallback } from "react";

export const useCommonUtils = () => {
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  return { formatDate };
};
