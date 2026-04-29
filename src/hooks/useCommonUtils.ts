import { useCallback } from "react";
import { formatDateTime } from "../utils/formatters";

export const useCommonUtils = () => {
  const formatDate = useCallback(
    (dateString: string, timeString?: string) =>
      formatDateTime(dateString, timeString),
    [],
  );

  return { formatDate };
};
