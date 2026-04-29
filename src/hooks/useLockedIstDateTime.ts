import { useEffect } from "react";
import { getCurrentIstDateTimeInputs } from "../utils/dateTime";

export type LockedIstDateTime = {
  date: string;
  time: string;
};

export const useLockedIstDateTime = (
  onTick: (dateTime: LockedIstDateTime) => void,
  enabled = true,
) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const updateLockedDateTimeFields = () => {
      onTick(getCurrentIstDateTimeInputs());
    };

    updateLockedDateTimeFields();
    const intervalId = window.setInterval(updateLockedDateTimeFields, 15000);

    return () => window.clearInterval(intervalId);
  }, [enabled, onTick]);
};
