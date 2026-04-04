import { PageLayout } from "~/components/layout";
import { type RouterOutputs, api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import filterPasses from "~/helpers/filterPasses";
import PeopleGrid from "~/components/peopleGrid";
import isAuth from "~/components/isAuth";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import handleApiError from "~/helpers/handleApiError";
import { SeasonTypeahead } from "~/components/seasonTypeahead";
import { DatePicker } from "antd";
import dayjs from "dayjs";

// ── Types ──────────────────────────────────────────────────────────────

type NewPassFormData = {
  label: string;
  season: string;
  members: { firstName: string; lastName: string; birthDate?: string }[];
};

type Patron = RouterOutputs["passes"]["getAll"][number]["patrons"][number];

// Deterministic color palette for avatars and accents
const AVATAR_COLORS = [
  "bg-primary text-primary-content",
  "bg-secondary text-secondary-content",
  "bg-accent text-accent-content",
  "bg-info text-info-content",
  "bg-success text-success-content",
  "bg-warning text-warning-content",
] as const;

const BORDER_COLORS = [
  "border-l-primary",
  "border-l-secondary",
  "border-l-accent",
  "border-l-info",
  "border-l-success",
  "border-l-warning",
] as const;

const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const avatarColor = (id: string) =>
  AVATAR_COLORS[hashStr(id) % AVATAR_COLORS.length]!;
const borderColor = (id: string) =>
  BORDER_COLORS[hashStr(id) % BORDER_COLORS.length]!;

// ── Inline patron editor (replaces the patron chip when editing) ──────

const InlinePatronEditor = ({
  patron,
  onSave,
  onCancel,
  isSaving,
}: {
  patron: Patron;
  onSave: (data: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate?: Date | null;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [firstName, setFirstName] = useState(patron.firstName);
  const [lastName, setLastName] = useState(patron.lastName);
  const [birthDate, setBirthDate] = useState(
    patron.birthDate ? dayjs(patron.birthDate) : null,
  );

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-primary/30 bg-base-100 p-3">
      <div className="form-control min-w-[120px] flex-1">
        <label className="label py-0">
          <span className="label-text text-xs">First Name</span>
        </label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="input input-bordered input-sm"
          disabled={isSaving}
        />
      </div>
      <div className="form-control min-w-[120px] flex-1">
        <label className="label py-0">
          <span className="label-text text-xs">Last Name</span>
        </label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="input input-bordered input-sm"
          disabled={isSaving}
        />
      </div>
      <div className="form-control min-w-[140px]">
        <label className="label py-0">
          <span className="label-text text-xs">Birthday</span>
        </label>
        <DatePicker
          value={birthDate}
          format="MM/DD/YYYY"
          className="input input-bordered input-sm w-full"
          onChange={(d) => setBirthDate(d)}
          disabled={isSaving}
        />
      </div>
      <div className="flex gap-1">
        <button
          onClick={() =>
            onSave({
              id: patron.id,
              firstName,
              lastName,
              birthDate: birthDate?.toDate() ?? null,
            })
          }
          disabled={!firstName.trim() || !lastName.trim() || isSaving}
          className="btn btn-primary btn-sm"
        >
          {isSaving ? <LoadingSpinner /> : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Inline add-member form (appears at bottom of expanded card) ───────

const InlineAddMember = ({
  passId,
  onAdded,
}: {
  passId: string;
  onAdded: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState<dayjs.Dayjs | null>(null);

  const { mutate, isLoading } = api.passes.createPatron.useMutation({
    onSuccess: () => {
      toast.success("Member added!");
      setFirstName("");
      setLastName("");
      setBirthDate(null);
      setShow(false);
      onAdded();
    },
    onError: handleApiError,
  });

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="btn btn-outline btn-primary btn-sm w-full"
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
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add Member
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
      <div className="form-control min-w-[120px] flex-1">
        <label className="label py-0">
          <span className="label-text text-xs">First Name</span>
        </label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="John"
          className="input input-bordered input-sm"
          disabled={isLoading}
        />
      </div>
      <div className="form-control min-w-[120px] flex-1">
        <label className="label py-0">
          <span className="label-text text-xs">Last Name</span>
        </label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe"
          className="input input-bordered input-sm"
          disabled={isLoading}
        />
      </div>
      <div className="form-control min-w-[140px]">
        <label className="label py-0">
          <span className="label-text text-xs">Birthday (opt.)</span>
        </label>
        <DatePicker
          value={birthDate}
          format="MM/DD/YYYY"
          className="input input-bordered input-sm w-full"
          onChange={(d) => setBirthDate(d)}
          disabled={isLoading}
        />
      </div>
      <div className="flex gap-1">
        <button
          onClick={() =>
            mutate({
              passId,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              birthDate: birthDate?.toDate() ?? null,
            })
          }
          disabled={!firstName.trim() || !lastName.trim() || isLoading}
          className="btn btn-primary btn-sm"
        >
          {isLoading ? <LoadingSpinner /> : "Add"}
        </button>
        <button
          onClick={() => setShow(false)}
          disabled={isLoading}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Expanded pass management panel ────────────────────────────────────

const PassManagementPanel = ({
  pass,
  isAdmin,
}: {
  pass: RouterOutputs["passes"]["getAll"][number];
  isAdmin: boolean;
}) => {
  const [editingPatronId, setEditingPatronId] = useState<string | null>(null);
  const [editingPass, setEditingPass] = useState(false);
  const [passLabel, setPassLabel] = useState(pass.label);
  const [passSeason, setPassSeason] = useState(pass.season);

  const ctx = api.useUtils();
  const invalidateAll = () => void ctx.passes.getAll.invalidate();

  const { mutate: updatePass, isLoading: isUpdatingPass } =
    api.passes.updateSeasonPass.useMutation({
      onSuccess: () => {
        toast.success("Pass updated!");
        setEditingPass(false);
        invalidateAll();
      },
      onError: handleApiError,
    });

  const { mutate: updatePatron, isLoading: isUpdatingPatron } =
    api.passes.updatePatron.useMutation({
      onSuccess: () => {
        toast.success("Member updated!");
        setEditingPatronId(null);
        invalidateAll();
      },
      onError: handleApiError,
    });

  return (
    <div className="mt-4 space-y-4 border-t border-base-200 pt-4">
      {/* Pass details quick-edit */}
      <div className="flex items-center gap-2">
        {editingPass ? (
          <div className="flex flex-1 flex-wrap items-end gap-2">
            <div className="form-control flex-1">
              <label className="label py-0">
                <span className="label-text text-xs font-medium">
                  Pass Label
                </span>
              </label>
              <input
                value={passLabel}
                onChange={(e) => setPassLabel(e.target.value)}
                className="input input-bordered input-sm"
                disabled={isUpdatingPass}
              />
            </div>
            {isAdmin && (
              <div className="form-control w-32">
                <label className="label py-0">
                  <span className="label-text text-xs font-medium">
                    Season
                  </span>
                </label>
                <SeasonTypeahead
                  value={passSeason}
                  onChange={setPassSeason}
                  disabled={isUpdatingPass}
                  className="input input-bordered input-sm"
                />
              </div>
            )}
            <button
              onClick={() =>
                updatePass({
                  id: pass.id,
                  label: passLabel.trim(),
                  season: passSeason,
                })
              }
              disabled={
                !passLabel.trim() || !passSeason.trim() || isUpdatingPass
              }
              className="btn btn-primary btn-sm"
            >
              {isUpdatingPass ? <LoadingSpinner /> : "Save"}
            </button>
            <button
              onClick={() => {
                setPassLabel(pass.label);
                setPassSeason(pass.season);
                setEditingPass(false);
              }}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingPass(true)}
            className="btn btn-ghost btn-xs text-base-content/60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
              />
            </svg>
            Edit pass details
          </button>
        )}
      </div>

      {/* Patron rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-base-content/80">
            Family Members ({pass.patrons.length})
          </h4>
        </div>

        {pass.patrons.length === 0 && (
          <p className="py-4 text-center text-sm text-base-content/50">
            No members yet — add your first member below
          </p>
        )}

        {pass.patrons.map((patron) =>
          editingPatronId === patron.id ? (
            <InlinePatronEditor
              key={patron.id}
              patron={patron}
              onSave={(data) => updatePatron(data)}
              onCancel={() => setEditingPatronId(null)}
              isSaving={isUpdatingPatron}
            />
          ) : (
            <div
              key={patron.id}
              className="flex items-center justify-between rounded-lg bg-base-100 px-3 py-2.5 ring-1 ring-base-content/5 transition-colors hover:ring-primary/20"
            >
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className={`w-8 rounded-full ${avatarColor(patron.id)}`}>
                    <span className="text-xs">
                      {patron.firstName.charAt(0)}
                      {patron.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium capitalize">
                    {patron.firstName} {patron.lastName}
                  </span>
                  <span className="ml-2 text-xs text-base-content/60">
                    {patron.birthDate
                      ? `${new Date().getFullYear() - patron.birthDate.getFullYear()}y`
                      : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingPatronId(patron.id)}
                className="btn btn-ghost btn-xs"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                  />
                </svg>
                Edit
              </button>
            </div>
          ),
        )}

        <InlineAddMember passId={pass.id} onAdded={invalidateAll} />
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────

function PassesPage() {
  const currentYear = new Date().getFullYear().toString();

  const [filter, setFilter] = useState("");
  const [showNewPassForm, setShowNewPassForm] = useState(false);
  const [expandedPasses, setExpandedPasses] = useState<Set<string>>(new Set());
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  const { data: userSettings } = api.profile.getSettingsByUser.useQuery();
  const isAdmin = userSettings?.isAdmin ?? false;

  const { data: availableSeasons } = api.passes.getAllSeasons.useQuery(
    undefined,
    { enabled: isAdmin },
  );

  const { data, isLoading } = api.passes.getAll.useQuery(
    selectedSeason ? { season: selectedSeason } : undefined,
  );

  const filteredPasses = data?.filter((d) => filterPasses(d, filter));

  const ctx = api.useUtils();

  // ── Create pass with members ──────────────────────────────────────

  const { mutate: createPass, isLoading: isCreating } =
    api.passes.createSeasonPass.useMutation({
      onSuccess: (newPass) => {
        toast.success(`Pass "${newPass.label}" created!`);
        setShowNewPassForm(false);
        resetNewPass();
        void ctx.passes.getAll.invalidate();
        // Auto-expand the new pass so the user sees it immediately
        setExpandedPasses((prev) => new Set(prev).add(newPass.id));
      },
      onError: handleApiError,
    });

  const {
    register: registerNewPass,
    handleSubmit: handleNewPassSubmit,
    reset: resetNewPass,
    control: newPassControl,
    formState: { isValid: newPassValid },
  } = useForm<NewPassFormData>({
    defaultValues: { label: "", season: currentYear, members: [] },
  });

  const {
    fields: memberFields,
    append: addMember,
    remove: removeMember,
  } = useFieldArray({ control: newPassControl, name: "members" });

  const onNewPassSubmit = (data: NewPassFormData) => {
    createPass({
      seasonPass: { label: data.label, season: data.season },
      patrons: data.members
        .filter((m) => m.firstName.trim() && m.lastName.trim())
        .map((m) => ({
          firstName: m.firstName.trim(),
          lastName: m.lastName.trim(),
          birthDate: m.birthDate ? new Date(m.birthDate) : null,
        })),
    });
  };

  // ── Copy to current year ──────────────────────────────────────────

  const { mutate: copyPassToCurrentYear, isLoading: isCopying } =
    api.passes.copySeasonPassToCurrentYear.useMutation({
      onSuccess: (newPass) => {
        toast.success(
          `Pass "${newPass.label}" copied to ${currentYear}!`,
        );
        void ctx.passes.getAll.invalidate();
      },
      onError: handleApiError,
    });

  const handleCopyToCurrentYear = (passId: string, passLabel: string) => {
    if (
      confirm(
        `Copy "${passLabel}" and all its members to ${currentYear}?`,
      )
    ) {
      copyPassToCurrentYear({ passId });
    }
  };

  // ── Toggle expand ─────────────────────────────────────────────────

  const togglePassExpansion = (passId: string) => {
    setExpandedPasses((prev) => {
      const next = new Set(prev);
      if (next.has(passId)) next.delete(passId);
      else next.add(passId);
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <PageLayout>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="flex min-h-full flex-col gap-6 bg-primary/[0.03] p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-xl bg-base-100 p-4 shadow-sm ring-1 ring-base-content/5 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
                  Season Passes
                </h1>
                <p className="mt-1 text-sm text-base-content/60">
                  Create, manage, and update family season passes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="stats stats-horizontal bg-base-100 shadow-sm">
                  <div className="stat px-4 py-2">
                    <div className="stat-title text-xs">Passes</div>
                    <div className="stat-value text-lg text-primary">
                      {data?.length ?? 0}
                    </div>
                  </div>
                  <div className="stat px-4 py-2">
                    <div className="stat-title text-xs">Members</div>
                    <div className="stat-value text-lg text-secondary">
                      {data?.reduce(
                        (acc, pass) => acc + pass.patrons.length,
                        0,
                      ) ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search bar + actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[200px] flex-1">
                <div className="relative">
                  <input
                    id="pass-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Search passes or members..."
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

              {isAdmin && availableSeasons && availableSeasons.length > 1 && (
                <select
                  id="season-filter"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="select select-bordered select-sm"
                >
                  <option value="">All Seasons</option>
                  {availableSeasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => {
                  setShowNewPassForm(!showNewPassForm);
                  if (!showNewPassForm) resetNewPass();
                }}
                className={`btn ${showNewPassForm ? "btn-ghost" : "btn-primary"}`}
              >
                {showNewPassForm ? (
                  "Cancel"
                ) : (
                  <>
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
                  </>
                )}
              </button>
            </div>

            {/* ── New Pass Creation Form (with inline member rows) ─── */}
            {showNewPassForm && (
              <form
                onSubmit={handleNewPassSubmit(onNewPassSubmit)}
                className="card border border-primary/20 bg-base-100 shadow-lg"
              >
                <div className="card-body gap-5">
                  <h3 className="card-title text-lg">
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
                        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Z"
                      />
                    </svg>
                    Create New Season Pass
                  </h3>

                  {/* Pass name + season row */}
                  <div className="flex flex-wrap gap-3">
                    <div className="form-control min-w-[200px] flex-1">
                      <label className="label py-0">
                        <span className="label-text text-xs font-medium">
                          Family / Pass Name
                        </span>
                      </label>
                      <input
                        {...registerNewPass("label", { required: true })}
                        placeholder="e.g. Johnson, Anderson"
                        className="input input-bordered"
                        disabled={isCreating}
                      />
                    </div>
                    <div className="form-control w-32">
                      <label className="label py-0">
                        <span className="label-text text-xs font-medium">
                          Season
                        </span>
                      </label>
                      <Controller
                        name="season"
                        control={newPassControl}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <SeasonTypeahead
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Year"
                            disabled={isCreating}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Members section */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-base-content/80">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="mr-1 inline h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                          />
                        </svg>
                        Family Members
                        {memberFields.length > 0 && (
                          <span className="badge badge-sm ml-1">
                            {memberFields.length}
                          </span>
                        )}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          addMember({ firstName: "", lastName: "" })
                        }
                        disabled={isCreating}
                        className="btn btn-outline btn-primary btn-xs"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                        Add Member
                      </button>
                    </div>

                    {memberFields.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-base-300 p-4 text-center text-sm text-base-content/50">
                        <p>No members added yet</p>
                        <p className="text-xs">
                          Click &ldquo;Add Member&rdquo; to include family
                          members with this pass
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {memberFields.map((field, idx) => (
                          <div
                            key={field.id}
                            className="flex flex-wrap items-end gap-2 rounded-lg bg-base-100 p-2 ring-1 ring-base-content/5"
                          >
                            <div className="form-control min-w-[100px] flex-1">
                              {idx === 0 && (
                                <label className="label py-0">
                                  <span className="label-text text-xs">
                                    First Name
                                  </span>
                                </label>
                              )}
                              <input
                                {...registerNewPass(
                                  `members.${idx}.firstName`,
                                  { required: true },
                                )}
                                placeholder="First"
                                className="input input-bordered input-sm"
                                disabled={isCreating}
                              />
                            </div>
                            <div className="form-control min-w-[100px] flex-1">
                              {idx === 0 && (
                                <label className="label py-0">
                                  <span className="label-text text-xs">
                                    Last Name
                                  </span>
                                </label>
                              )}
                              <input
                                {...registerNewPass(
                                  `members.${idx}.lastName`,
                                  { required: true },
                                )}
                                placeholder="Last"
                                className="input input-bordered input-sm"
                                disabled={isCreating}
                              />
                            </div>
                            <div className="form-control min-w-[130px]">
                              {idx === 0 && (
                                <label className="label py-0">
                                  <span className="label-text text-xs">
                                    Birthday (opt.)
                                  </span>
                                </label>
                              )}
                              <Controller
                                name={`members.${idx}.birthDate`}
                                control={newPassControl}
                                render={({ field: f }) => (
                                  <DatePicker
                                    value={
                                      f.value ? dayjs(f.value) : null
                                    }
                                    format="MM/DD/YYYY"
                                    className="input input-bordered input-sm w-full"
                                    onChange={(d) =>
                                      f.onChange(
                                        d?.toISOString() ?? undefined,
                                      )
                                    }
                                    disabled={isCreating}
                                  />
                                )}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMember(idx)}
                              disabled={isCreating}
                              className="btn btn-circle btn-ghost btn-sm text-error"
                              title="Remove member"
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
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewPassForm(false);
                        resetNewPass();
                      }}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newPassValid || isCreating}
                      className="btn btn-primary"
                    >
                      {isCreating ? (
                        <LoadingSpinner />
                      ) : (
                        <>
                          Create Pass
                          {memberFields.length > 0 &&
                            ` with ${memberFields.length} member${memberFields.length > 1 ? "s" : ""}`}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ── Passes List ───────────────────────────────────────── */}
          {!!filteredPasses?.length ? (
            <div className="grid gap-3">
              {filteredPasses.map((pass) => {
                const isExpanded = expandedPasses.has(pass.id);

                return (
                  <div
                    key={pass.id}
                    className={`card border-l-4 bg-base-100 transition-all duration-200 ${borderColor(pass.id)} ${
                      isExpanded
                        ? "ring-2 ring-primary/20 shadow-lg"
                        : "shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="card-body p-4 sm:p-5">
                      {/* Pass header row */}
                      <div
                        className="flex cursor-pointer items-center justify-between"
                        onClick={() => togglePassExpansion(pass.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className={`w-10 rounded-lg ${avatarColor(pass.id)}`}>
                              <span className="text-sm font-bold">
                                {pass.label.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold leading-tight">
                              {pass.label}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <span>Season {pass.season}</span>
                              <span>·</span>
                              <span>
                                {pass.patrons.length}{" "}
                                {pass.patrons.length === 1
                                  ? "member"
                                  : "members"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {pass.season !== currentYear && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyToCurrentYear(pass.id, pass.label);
                              }}
                              disabled={isCopying}
                              className="btn btn-outline btn-xs hidden gap-1 sm:inline-flex"
                              title={`Copy to ${currentYear}`}
                            >
                              {isCopying ? (
                                <LoadingSpinner />
                              ) : (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-3.5 w-3.5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124M15.75 17.25h-3.375c-.621 0-1.125-.504-1.125-1.125V11.25c0-.621.504-1.125 1.125-1.125h3.375c.621 0 1.125.504 1.125 1.125v4.875c0 .621-.504 1.125-1.125 1.125Z"
                                    />
                                  </svg>
                                  {currentYear}
                                </>
                              )}
                            </button>
                          )}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className={`h-5 w-5 text-base-content/40 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Collapsed patron preview chips */}
                      {!isExpanded && pass.patrons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {pass.patrons.slice(0, 4).map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-base-100 px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-base-content/10"
                            >
                              <span className={`inline-block h-2 w-2 rounded-full ${avatarColor(p.id).split(" ")[0]}`} />
                              {p.firstName} {p.lastName}
                            </span>
                          ))}
                          {pass.patrons.length > 4 && (
                            <span className="inline-flex items-center rounded-full bg-base-100 px-2.5 py-1 text-xs font-medium ring-1 ring-base-content/10">
                              +{pass.patrons.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expanded management panel */}
                      {isExpanded && (
                        <PassManagementPanel
                          pass={pass}
                          isAdmin={isAdmin}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl bg-base-100 py-16 shadow-sm ring-1 ring-base-content/5">
              <PeopleGrid />
              <div className="mt-8 text-center">
                <h3 className="mb-2 text-xl font-semibold text-base-content">
                  {filter
                    ? "No passes match your search"
                    : "No Season Passes Yet"}
                </h3>
                <p className="mb-6 text-base-content/60">
                  {filter
                    ? "Try a different search term"
                    : "Create your first season pass to get started"}
                </p>
                {!filter && (
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
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}

export default isAuth(PassesPage, "employee");
