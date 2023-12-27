import { useParams } from "next/navigation";
import { PageLayout } from "~/components/layout";
import { api } from "~/utils/api";

export default function SinglePatronPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, isLoading } = api.passes.getPatronById.useQuery({ id });

  return (
    <PageLayout hideHeader>
      works
      {/* // todo pull form element out of PatronFormSectionL? */}
    </PageLayout>
  );
}
