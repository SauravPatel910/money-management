import { useCallback } from "react";

export const useCommonUtils = () => {
  const formatDate = useCallback((dateString: string, timeString?: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const formattedDate = new Date(`${dateString}T00:00:00`).toLocaleDateString(
      undefined,
      options,
    );

    if (!timeString) {
      return formattedDate;
    }

    const formattedTime = new Date(
      `${dateString}T${timeString}:00`,
    ).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${formattedDate}, ${formattedTime}`;
  }, []);

  return { formatDate };
};
