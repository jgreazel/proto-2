import dayjs from "dayjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import PatronForm from "~/components/patronForm";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

function SinglePatronPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, isLoading } = api.passes.getPatronById.useQuery({ id });

  const router = useRouter();

  const ctx = api.useUtils();
  const { mutate, isLoading: isUpdating } = api.passes.updatePatron.useMutation(
    {
      onError: handleApiError,
      onSuccess: async () => {
        toast.success("Update Successful!");
        void ctx.passes.getPatronById.invalidate();
        await router.push("/passes");
      },
    },
  );

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl p-2">
        <h1 className="pb-3 text-lg font-medium">Edit Patron</h1>
        <PatronForm
          data={{
            id: data?.id,
            firstName: data?.firstName ?? "",
            lastName: data?.lastName ?? "",
            birthDate: !!data?.birthDate ? dayjs(data.birthDate) : undefined,
          }}
          disabled={isLoading || isUpdating}
          onCancel={() => {
            router.back();
          }}
          submitText="Update"
          onSubmit={(data) => {
            if (!data.id) {
              toast.error("Missing patron id. Cannot update database");
            } else {
              mutate({
                ...data,
                id: data.id,
                birthDate: data.birthDate?.toDate(),
              });
            }
          }}
        />
      </div>
    </PageLayout>
  );
}

export default isAuth(SinglePatronPage, "employee");
