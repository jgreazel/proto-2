const dbUnitToDollars = (unit: number) => {
  const usDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return usDollar.format(unit / 100);
};

export default dbUnitToDollars;
