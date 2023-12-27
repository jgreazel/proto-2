import { useParams } from "next/navigation";
import { PageLayout } from "~/components/layout";
import { api } from "~/utils/api";

export default function SinglePatronPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = api.passes.getPatronById.useQuery({ id });

  return (
    <PageLayout hideHeader>
      works
      {/* // todo pull form element out of PatronFormSectionL? */}
    </PageLayout>
  );
}
