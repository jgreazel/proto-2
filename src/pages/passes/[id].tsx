import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";

import { type RouterOutputs, api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import handleApiError from "~/helpers/handleApiError";
import PatronForm, { type PatronFormData } from "~/components/patronForm";
import { PageLayout } from "~/components/layout";
import isAuth from "~/components/isAuth";
import { SeasonTypeahead } from "~/components/seasonTypeahead";

type SeasonPassFormData = {
  label: string;
  season: string;
};

// Simple patron management component
const PatronsList = (props: {
  patrons: RouterOutputs["passes"]["getById"]["patrons"];
  isEditing: boolean;
}) => {
  if (!props.patrons.length) {
    return (
      <div className="py-8 text-center text-base-content/60">
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
        <p className="font-medium">No patrons added yet</p>
        <p className="text-sm">Add family members to this pass</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {props.patrons.map((patron) => (
        <div
          key={patron.id}
          className="flex items-center justify-between rounded-lg bg-base-200/50 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="w-10 rounded-full bg-neutral text-neutral-content">
                <span className="text-sm">
                  {patron.firstName.charAt(0)}
                  {patron.lastName.charAt(0)}
                </span>
              </div>
            </div>
            <div>
              <div className="font-semibold capitalize">
                {patron.firstName} {patron.lastName}
              </div>
              <div className="text-sm text-base-content/70">
                {patron.birthDate
                  ? `${
                      new Date().getFullYear() - patron.birthDate.getFullYear()
                    } years old`
                  : "Age not specified"}
              </div>
            </div>
          </div>
          <Link
            href={`/passes/patrons/${patron.id}`}
            className="btn btn-ghost btn-sm"
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
            Edit
          </Link>
        </div>
      ))}
    </div>
  );
};

// Add patron form component
const AddPatronForm = (props: {
  passId: string;
  onPatronAdded: () => void;
}) => {
  const [showForm, setShowForm] = useState(false);

  const { mutate: createPatron, isLoading } =
    api.passes.createPatron.useMutation({
      onSuccess: () => {
        toast.success("Patron added successfully!");
        setShowForm(false);
        props.onPatronAdded();
      },
      onError: handleApiError,
    });

  const onSubmit = (data: PatronFormData) => {
    createPatron({
      ...data,
      passId: props.passId,
      birthDate: data.birthDate?.toDate(),
    });
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="btn btn-outline btn-primary w-full"
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
        Add Family Member
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-base-100 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold">Add New Family Member</h4>
        <button
          onClick={() => setShowForm(false)}
          className="btn btn-circle btn-ghost btn-sm"
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
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <PatronForm
        disabled={isLoading}
        onCancel={() => setShowForm(false)}
        onSubmit={onSubmit}
        submitText="Add Member"
      />
    </div>
  );
};

function SinglePassPage() {
  const params = useParams();
  const id = (id: string | string[] | undefined = params?.id) =>
    id?.toString() ?? "0";
  const isEditing = id() !== "0";

  const { data, isLoading, refetch } = api.passes.getById.useQuery(
    { id: id() },
    { enabled: isEditing },
  );
  const isReallyLoading = isLoading && isEditing;

  // Get user settings to check if admin
  const { data: userSettings } = api.profile.getSettingsByUser.useQuery();
  const isAdmin = userSettings?.isAdmin ?? false;

  const router = useRouter();

  const currentYear = new Date().getFullYear().toString();

  const { register, handleSubmit, formState, reset, control } =
    useForm<SeasonPassFormData>({
      defaultValues: {
        label: "",
        season: currentYear,
      },
    });

  useEffect(() => {
    if (data) {
      reset({
        label: data.label,
        season: data.season,
      });
    } else if (!isEditing) {
      // For new passes, ensure we always start with current year
      reset({
        label: "",
        season: currentYear,
      });
    }
  }, [data, reset, isEditing, currentYear]);

  const ctx = api.useUtils();

  const { mutate: createMutate, isLoading: isCreating } =
    api.passes.createSeasonPass.useMutation({
      onSuccess: async () => {
        await ctx.passes.getAll.invalidate();
        toast.success("Season pass created!");
        void router.push("/passes");
      },
      onError: handleApiError,
    });

  const { mutate: updateMutate, isLoading: isUpdating } =
    api.passes.updateSeasonPass.useMutation({
      onSuccess: async () => {
        await ctx.passes.getAll.invalidate();
        toast.success("Season pass updated!");
        void router.push("/passes");
      },
      onError: handleApiError,
    });

  const isMutating = isCreating || isUpdating;

  const onSubmit = (data: SeasonPassFormData) => {
    if (isEditing) {
      updateMutate({
        id: id(),
        ...data,
      });
    } else {
      createMutate({
        seasonPass: data,
        patrons: [],
      });
    }
  };

  const handlePatronAdded = () => {
    void refetch();
    void ctx.passes.getAll.invalidate();
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              {isEditing
                ? `Manage ${data?.label ?? "Pass"}`
                : "Create New Season Pass"}
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

        {isReallyLoading ? (
          <LoadingPage />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Pass Details Card */}
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
                        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Z"
                      />
                    </svg>
                    Pass Details
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          Family Name / Pass Label
                        </span>
                      </label>
                      <input
                        {...register("label", { required: true })}
                        placeholder="Ex: Johnson, Anderson, Smith..."
                        className="input input-bordered"
                        disabled={isMutating}
                      />
                      <label className="label">
                        <span className="label-text-alt">
                          This will be the display name for the pass
                        </span>
                      </label>
                    </div>

                    {/* Season Field - Admin Only */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          Season Year
                          {!isAdmin && (
                            <span className="badge badge-secondary badge-sm ml-2">
                              Admin Only
                            </span>
                          )}
                        </span>
                      </label>
                      {isAdmin ? (
                        <Controller
                          control={control}
                          name="season"
                          rules={{ required: true }}
                          render={({ field }) => (
                            <SeasonTypeahead
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Ex: 2025, 2026..."
                              disabled={isMutating}
                              className="input input-bordered"
                            />
                          )}
                        />
                      ) : (
                        <input
                          {...register("season")}
                          className="input input-bordered"
                          disabled={true}
                          placeholder="Contact admin to change season"
                        />
                      )}
                      <label className="label">
                        <span className="label-text-alt">
                          {isAdmin
                            ? "Type to see suggestions or enter a custom year"
                            : "Only admins can modify the season year"}
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Link href="/passes" className="btn btn-ghost">
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={!formState.isValid || isMutating}
                        className="btn btn-primary"
                      >
                        {isMutating ? (
                          <LoadingSpinner />
                        ) : isEditing ? (
                          "Update Pass"
                        ) : (
                          "Create Pass"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Family Members Section */}
              {isEditing && (
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
                          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                        />
                      </svg>
                      Family Members ({data?.patrons.length ?? 0})
                    </h2>

                    <div className="space-y-4">
                      <PatronsList
                        patrons={data?.patrons ?? []}
                        isEditing={isEditing}
                      />
                      <AddPatronForm
                        passId={id()}
                        onPatronAdded={handlePatronAdded}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              {isEditing && data && (
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Quick Stats</h3>
                    <div className="stats stats-vertical">
                      <div className="stat">
                        <div className="stat-title">Total Members</div>
                        <div className="stat-value text-2xl">
                          {data.patrons.length}
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Adults</div>
                        <div className="stat-value text-2xl">
                          {
                            data.patrons.filter((p) => {
                              if (!p.birthDate) return true;
                              const age =
                                new Date().getFullYear() -
                                p.birthDate.getFullYear();
                              return age >= 18;
                            }).length
                          }
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Children</div>
                        <div className="stat-value text-2xl">
                          {
                            data.patrons.filter((p) => {
                              if (!p.birthDate) return false;
                              const age =
                                new Date().getFullYear() -
                                p.birthDate.getFullYear();
                              return age < 18;
                            }).length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Card */}
              <div className="card border border-info/20 bg-info/10">
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
                  <ul className="space-y-2 text-sm">
                    <li>• Add all family members who will use this pass</li>
                    <li>
                      • Include birth dates for accurate age-based pricing
                    </li>
                    <li>• Each family member can be edited individually</li>
                    <li>• Season passes are valid for one full year</li>
                    {isAdmin && (
                      <li>
                        • As an admin, you can modify the season year with
                        typeahead suggestions
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default isAuth(SinglePassPage, "employee");
