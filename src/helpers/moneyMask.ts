const moneyMask = {
  parser: (value?: string) => {
    const cleanedValue = value?.replace(/[^\d]/g, "") ?? "";
    return parseInt(cleanedValue) || 0;
  },
  formatter: (value?: number) => {
    if (!value && value !== 0) return "";
    const dollars = Math.floor(value / 100);
    const cents = value % 100;
    return `$${dollars}.${cents.toString().padStart(2, "0")}`;
  },
};
export default moneyMask;
