import { type RouterOutputs } from "~/utils/api";

const filterPasses = (
  d: RouterOutputs["passes"]["getAll"][number],
  filter: string,
) => {
  if (!filter) return true;

  const passMatches = d.label.toLowerCase().includes(filter.toLowerCase());
  const patronsMatch = d.patrons.some((p) => {
    const fullName = `${p.firstName} ${p.lastName}`;
    return fullName.toLowerCase().includes(filter.toLowerCase());
  });
  return passMatches || patronsMatch;
};

export default filterPasses;
