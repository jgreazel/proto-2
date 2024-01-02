import { useParams } from "next/navigation";
import { PageLayout } from "~/components/layout";
import PatronForm from "~/components/patronForm";
import { api } from "~/utils/api";

export default function SinglePatronPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  // ? somehow were redirecting to a /:id url but that id is bunk
  // where is that link getting its value from? how is it not related to an existing patron?
  const { data, isLoading } = api.passes.getPatronById.useQuery({ id });

  return (
    <PageLayout hideHeader>
      <PatronForm
        disabled={isLoading}
        onCancel={() => {
          return;
        }}
        submitText="Update"
        onSubmit={() => {
          return;
        }}
      />
    </PageLayout>
  );
}
