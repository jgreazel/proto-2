import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import PatronForm from "~/components/patronForm";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

export default function SinglePatronPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, isLoading } = api.passes.getPatronById.useQuery({ id });

  const router = useRouter();

  const ctx = api.useUtils();
  const { mutate, isLoading: isUpdating } = api.passes.updatePatron.useMutation(
    {
      onError: handleApiError,
      onSuccess: () => {
        toast("Update Successful!");
        void ctx.passes.getPatronById.invalidate();
      },
    },
  );

  return (
    <PageLayout hideHeader>
      <PatronForm
        data={data}
        disabled={isLoading || isUpdating}
        onCancel={() => {
          router.back();
        }}
        submitText="Update"
        onSubmit={(data) => {
          if (!data.id) {
            toast.error("Missing patron id. Cannot update database");
          } else {
            mutate({ id: data.id, ...data });
          }
        }}
      />
    </PageLayout>
  );
}
