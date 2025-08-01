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
      <div className="mx-auto max-w-2xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="breadcrumbs text-sm">
              <ul>
                <li>
                  <Link href="/passes">Season Passes</Link>
                </li>
                <li>Edit Patron</li>
              </ul>
            </div>
            <h1 className="text-3xl font-bold text-base-content">
              Edit Patron Information
            </h1>
          </div>
          <Link href="/passes" className="btn btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
            Close
          </Link>
        </div>

        {/* Patron Form Card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4 text-xl">
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
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              Patron Details
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <PatronForm
                data={{
                  id: data?.id,
                  firstName: data?.firstName ?? "",
                  lastName: data?.lastName ?? "",
                  birthDate: !!data?.birthDate
                    ? dayjs(data.birthDate)
                    : undefined,
                }}
                disabled={isLoading || isUpdating}
                onCancel={() => {
                  router.back();
                }}
                submitText="Update Patron"
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
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="card mt-6 border border-info/20 bg-info/10">
          <div className="card-body">
            <h3 className="card-title text-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
              Tips
            </h3>
            <ul className="space-y-1 text-sm">
              <li>• Birth date helps with age verification and pricing</li>
              <li>• Names should match ID for entry verification</li>
              <li>• Changes are saved immediately after submission</li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default isAuth(SinglePatronPage, "employee");
