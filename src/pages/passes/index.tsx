import { PageLayout } from "~/components/layout";
import { api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import Link from "next/link";
import { useState } from "react";
import filterPasses from "~/helpers/filterPasses";
import PeopleGrid from "~/components/peopleGrid";
import isAuth from "~/components/isAuth";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import handleApiError from "~/helpers/handleApiError";

type PassFormData = {
  label: string;
};

function PassesPage() {
  const { data, isLoading } = api.passes.getAll.useQuery();
  const [filter, setFilter] = useState("");
  const [showNewPassForm, setShowNewPassForm] = useState(false);
  const [expandedPass, setExpandedPass] = useState<string | null>(null);

  const filteredPasses = data?.filter((d) => filterPasses(d, filter));

  const ctx = api.useUtils();
  const { mutate: createPass, isLoading: isCreating } =
    api.passes.createSeasonPass.useMutation({
      onSuccess: () => {
        toast.success("Season pass created successfully!");
        setShowNewPassForm(false);
        reset();
        void ctx.passes.getAll.invalidate();
      },
      onError: handleApiError,
    });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm<PassFormData>();

  const onSubmit = (data: PassFormData) => {
    createPass({
      seasonPass: data,
      patrons: [],
    });
  };

  const togglePassExpansion = (passId: string) => {
    setExpandedPass(expandedPass === passId ? null : passId);
  };

  return (
    <PageLayout>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="flex h-full flex-col gap-6 p-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-base-content">
                  Season Passes
                </h1>
                <p className="mt-1 text-base-content/70">
                  Manage family passes and patron information
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="stats bg-base-200 shadow">
                  <div className="stat">
                    <div className="stat-title text-xs">Total Passes</div>
                    <div className="stat-value text-lg">
                      {data?.length ?? 0}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title text-xs">Total Patrons</div>
                    <div className="stat-value text-lg">
                      {data?.reduce(
                        (acc, pass) => acc + pass.patrons.length,
                        0,
                      ) ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    id="pass-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Search passes or patrons..."
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setShowNewPassForm(!showNewPassForm)}
                className="btn btn-primary"
              >
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                New Pass
              </button>
            </div>

            {/* New Pass Form */}
            {showNewPassForm && (
              <div className="card border border-primary/20 bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="card-title text-lg">
                      Create New Season Pass
                    </h3>
                    <button
                      onClick={() => setShowNewPassForm(false)}
                      className="btn btn-circle btn-ghost btn-sm"
                    >
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
                    </button>
                  </div>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex gap-3"
                  >
                    <input
                      {...register("label", { required: true })}
                      placeholder="Family name (e.g., Johnson, Anderson)"
                      className="input input-bordered flex-1"
                      disabled={isCreating}
                    />
                    <button
                      type="submit"
                      disabled={!isValid || !isDirty || isCreating}
                      className="btn btn-primary"
                    >
                      {isCreating ? <LoadingSpinner /> : "Create Pass"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Passes List */}
          {!!filteredPasses?.length ? (
            <div className="grid gap-4">
              {filteredPasses.map((pass) => (
                <div
                  key={pass.id}
                  className="card bg-base-100 shadow-lg transition-shadow duration-200 hover:shadow-xl"
                >
                  <div className="card-body">
                    {/* Pass Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="card-title text-xl">{pass.label}</h2>
                        <div className="badge badge-outline">
                          {pass.patrons.length}{" "}
                          {pass.patrons.length === 1 ? "patron" : "patrons"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePassExpansion(pass.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className={`h-5 w-5 transition-transform ${
                              expandedPass === pass.id ? "rotate-180" : ""
                            }`}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                          {expandedPass === pass.id ? "Collapse" : "Expand"}
                        </button>
                        <Link
                          href={`passes/${pass.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                            />
                          </svg>
                          Manage
                        </Link>
                      </div>
                    </div>

                    {/* Patrons Quick View */}
                    {pass.patrons.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-3 flex flex-wrap gap-2">
                          {pass.patrons
                            .slice(0, expandedPass === pass.id ? undefined : 3)
                            .map((patron) => (
                              <div
                                key={patron.id}
                                className="flex items-center gap-2 rounded-lg bg-base-200 px-3 py-2"
                              >
                                <div className="avatar placeholder">
                                  <div className="w-8 rounded-full bg-neutral text-neutral-content">
                                    <span className="text-xs">
                                      {patron.firstName.charAt(0)}
                                      {patron.lastName.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium capitalize">
                                    {patron.firstName} {patron.lastName}
                                  </div>
                                  <div className="text-xs text-base-content/70">
                                    {!!patron.birthDate
                                      ? `${
                                          new Date().getFullYear() -
                                          patron.birthDate.getFullYear()
                                        } years old`
                                      : "Age not specified"}
                                  </div>
                                </div>
                                <Link
                                  href={`passes/patrons/${patron.id}`}
                                  className="btn btn-ghost btn-xs"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-3 w-3"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                    />
                                  </svg>
                                </Link>
                              </div>
                            ))}
                          {!expandedPass && pass.patrons.length > 3 && (
                            <button
                              onClick={() => togglePassExpansion(pass.id)}
                              className="flex items-center gap-1 rounded-lg bg-base-300 px-3 py-2 text-sm transition-colors hover:bg-base-200"
                            >
                              +{pass.patrons.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {pass.patrons.length === 0 && (
                      <div className="mt-4 py-8 text-center text-base-content/50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="mx-auto mb-2 h-12 w-12 opacity-50"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                          />
                        </svg>
                        <p>No patrons added yet</p>
                        <p className="text-sm">
                          Click &quot;Manage&quot; to add family members
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <PeopleGrid />
              <div className="mt-8 text-center">
                <h3 className="mb-2 text-xl font-semibold text-base-content">
                  No Season Passes Yet
                </h3>
                <p className="mb-6 text-base-content/70">
                  Create your first season pass to get started
                </p>
                <button
                  onClick={() => setShowNewPassForm(true)}
                  className="btn btn-primary"
                >
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Create First Pass
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}

export default isAuth(PassesPage, "employee");
