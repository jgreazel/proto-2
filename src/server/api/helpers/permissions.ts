const getPerm = (id: string, description: string) => {
  return [
    {
      id,
      description,
      requireOverride: false,
    },
    {
      id: id + "-o",
      description: description + "WithOverride",
      requireOverride: true,
    },
  ];
};

// todo start here
// finish defining all the permissions
// decide how to handle overrides, think I was mostly there last time but who knows
export const permissions = [
  getPerm("1", "ViewSalesDesk"),
  getPerm("2", "ViewInventory"),
  getPerm("3", "CreateInventory"),
  getPerm("2", "ViewInventory"),
  getPerm("2", "ViewInventory"),
  getPerm("2", "ViewInventory"),
];
