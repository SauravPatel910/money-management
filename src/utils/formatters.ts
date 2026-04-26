export const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;

export const formatDateTime = (dateString: string, timeString?: string) => {
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
};
