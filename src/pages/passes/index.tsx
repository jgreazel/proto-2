import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";

export default function ItemsPage() {
  const { data, isLoading } = api.passes.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <PageLayout
      actionRow={
        <div>
          <Button href="passes/0">Add Pass</Button>
        </div>
      }
    >
      <h1 className="p-3 font-bold underline">Season Passes</h1>
      {data.map((p) => (
        <div key={p.id + "-pass-card"}>
          <div>{p.label}</div>
        </div>
      ))}
    </PageLayout>
  );
}
