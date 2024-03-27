import dayjs from "dayjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import PatronForm from "~/components/patronForm";
import handleApiError from "~/helpers/handleApiError";
import { type RouterOutputs, api } from "~/utils/api";

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
    <PageLayout>
      <dialog id="single-item-modal" className="modal modal-open">
        <form method="dialog" className="modal-backdrop">
          <Link href="/passes">close</Link>
        </form>
        <div className="modal-box">
          <form method="dialog">
            <Link
              href="/passes"
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </Link>
          </form>

          <PatronForm
            data={{
              id: data?.id,
              firstName: data?.firstName ?? "",
              lastName: data?.lastName ?? "",
              birthDate: dayjs(data?.birthDate),
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
                  birthDate: data.birthDate.toDate(),
                });
              }
            }}
          />
        </div>
      </dialog>
    </PageLayout>
  );
}
