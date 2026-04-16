import { PageLayout } from "~/components/layout";
import { type RouterOutputs, api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState, useMemo } from "react";
import filterPasses from "~/helpers/filterPasses";
import PeopleGrid from "~/components/peopleGrid";
import isAuth from "~/components/isAuth";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import handleApiError from "~/helpers/handleApiError";
import { SeasonTypeahead } from "~/components/seasonTypeahead";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import useKeyboardShortcuts from "~/helpers/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "~/components/keyboardShortcutsHelp";

// ── Types ──────────────────────────────────────────────────────────────

type NewPassFormData = {
  label: string;
  season: string;
  members: { firstName: string; lastName: string; birthDate?: string }[];
};

type Pass = RouterOutputs["passes"]["getAll"][number];
type Patron = Pass["patrons"][number];

// ── Color helpers ──────────────────────────────────────────────────────

// Color is keyed to the first letter of the pass label so users can
// visually scan for a letter group (all "S" passes share one hue, etc.)
const LETTER_COLORS: Record<string, { bg: string; border: string }> = {};
const HUES = [
  { bg: "bg-blue-100 text-blue-700",     border: "border-l-blue-400" },
  { bg: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-400" },
  { bg: "bg-amber-100 text-amber-700",   border: "border-l-amber-400" },
  { bg: "bg-violet-100 text-violet-700", border: "border-l-violet-400" },
  { bg: "bg-rose-100 text-rose-700",     border: "border-l-rose-400" },
  { bg: "bg-cyan-100 text-cyan-700",     border: "border-l-cyan-400" },
  { bg: "bg-orange-100 text-orange-700", border: "border-l-orange-400" },
  { bg: "bg-teal-100 text-teal-700",     border: "border-l-teal-400" },
  { bg: "bg-pink-100 text-pink-700",     border: "border-l-pink-400" },
];

const hueForLetter = (label: string) => {
  const ch = label.charAt(0).toUpperCase();
  if (!LETTER_COLORS[ch]) {
    const idx = (ch.charCodeAt(0) - 65) % HUES.length;
    LETTER_COLORS[ch] = HUES[Math.abs(idx)]!;
  }
  return LETTER_COLORS[ch]!;
};

const avatarColor = (label: string) => hueForLetter(label).bg;
const cardBorder = (label: string) => hueForLetter(label).border;

// ── Inline patron editor ──────────────────────────────────────────────

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
    <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-base-100 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="form-control">
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
        <div className="form-control">
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
      </div>
      <div className="form-control">
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
      <div className="flex justify-end gap-1">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
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
      </div>
    </div>
  );
};

// ── Inline add-member form ────────────────────────────────────────────

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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Member
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="form-control">
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
        <div className="form-control">
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
      </div>
      <div className="form-control">
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
      <div className="flex justify-end gap-1">
        <button
          onClick={() => setShow(false)}
          disabled={isLoading}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
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
      </div>
    </div>
  );
};

// ── Edit Pass Drawer ──────────────────────────────────────────────────

const EditPassDrawer = ({
  pass,
  isAdmin,
  currentYear,
  onClose,
  onCopy,
  isCopying,
}: {
  pass: Pass;
  isAdmin: boolean;
  currentYear: string;
  onClose: () => void;
  onCopy: (passId: string, passLabel: string) => void;
  isCopying: boolean;
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
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-base-300 bg-base-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className={`w-8 rounded-lg ${avatarColor(pass.label)}`}>
                <span className="text-xs font-bold">
                  {pass.label.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h2 className="font-semibold">{pass.label}</h2>
              <p className="text-xs text-base-content/60">
                Season {pass.season} · {pass.patrons.length}{" "}
                {pass.patrons.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          <button className="btn btn-circle btn-ghost btn-sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Pass details */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-base-content/70">
                Pass Details
              </h3>
              {!editingPass && (
                <button
                  onClick={() => setEditingPass(true)}
                  className="btn btn-ghost btn-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  Edit
                </button>
              )}
            </div>

            {editingPass ? (
              <div className="flex flex-col gap-2 rounded-lg border border-base-300 p-3">
                <div className="form-control">
                  <label className="label py-0">
                    <span className="label-text text-xs font-medium">Label</span>
                  </label>
                  <input
                    value={passLabel}
                    onChange={(e) => setPassLabel(e.target.value)}
                    className="input input-bordered input-sm"
                    disabled={isUpdatingPass}
                  />
                </div>
                {isAdmin && (
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-xs font-medium">Season</span>
                    </label>
                    <SeasonTypeahead
                      value={passSeason}
                      onChange={setPassSeason}
                      disabled={isUpdatingPass}
                      className="input input-bordered input-sm"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-1">
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
                  <button
                    onClick={() =>
                      updatePass({
                        id: pass.id,
                        label: passLabel.trim(),
                        season: passSeason,
                      })
                    }
                    disabled={!passLabel.trim() || !passSeason.trim() || isUpdatingPass}
                    className="btn btn-primary btn-sm"
                  >
                    {isUpdatingPass ? <LoadingSpinner /> : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 rounded-lg bg-base-200/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Label</span>
                  <span className="font-medium">{pass.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Season</span>
                  <span className="font-medium">{pass.season}</span>
                </div>
              </div>
            )}
          </div>

          {/* Renew button for past seasons */}
          {pass.season !== currentYear && (
            <button
              onClick={() => onCopy(pass.id, pass.label)}
              disabled={isCopying}
              className="btn btn-outline btn-sm w-full gap-2"
            >
              {isCopying ? (
                <LoadingSpinner />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                  </svg>
                  Renew for {currentYear}
                </>
              )}
            </button>
          )}

          {/* Members */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-base-content/70">
              Family Members ({pass.patrons.length})
            </h3>

            {pass.patrons.length === 0 && (
              <p className="py-4 text-center text-sm text-base-content/50">
                No members yet — add your first member below
              </p>
            )}

            <div className="space-y-2">
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
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 ring-1 ring-base-content/5 transition-colors hover:ring-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="w-8 rounded-full bg-base-300 text-base-content">
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
                        {patron.birthDate && (
                          <span className="ml-2 text-xs text-base-content/50">
                            {dayjs(patron.birthDate).format("MM/DD/YYYY")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingPatronId(patron.id)}
                      className="btn btn-ghost btn-xs"
                    >
                      Edit
                    </button>
                  </div>
                ),
              )}

              <InlineAddMember passId={pass.id} onAdded={invalidateAll} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── New Pass Drawer ───────────────────────────────────────────────────

const NewPassDrawer = ({
  currentYear,
  onClose,
}: {
  currentYear: string;
  onClose: () => void;
}) => {
  const ctx = api.useUtils();

  const { mutate: createPass, isLoading: isCreating } =
    api.passes.createSeasonPass.useMutation({
      onSuccess: (newPass) => {
        toast.success(`Pass "${newPass.label}" created!`);
        void ctx.passes.getAll.invalidate();
        onClose();
      },
      onError: handleApiError,
    });

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<NewPassFormData>({
    defaultValues: { label: "", season: currentYear, members: [] },
  });

  const {
    fields: memberFields,
    append: addMember,
    remove: removeMember,
  } = useFieldArray({ control, name: "members" });

  const onSubmit = (data: NewPassFormData) => {
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

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-base-300 bg-base-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <h2 className="font-semibold">New Season Pass</h2>
          </div>
          <button className="btn btn-circle btn-ghost btn-sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1 space-y-4 p-4">
            {/* Pass info */}
            <div className="form-control">
              <label className="label py-0">
                <span className="label-text text-xs font-medium">Pass Label</span>
              </label>
              <input
                {...register("label", { required: true })}
                placeholder="e.g. Smith Family"
                className="input input-bordered input-sm"
                disabled={isCreating}
                autoFocus
              />
            </div>

            <div className="form-control">
              <label className="label py-0">
                <span className="label-text text-xs font-medium">Season</span>
              </label>
              <Controller
                name="season"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SeasonTypeahead
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isCreating}
                    className="input input-bordered input-sm"
                  />
                )}
              />
            </div>

            {/* Members */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-base-content/70">
                  Members {memberFields.length > 0 && `(${memberFields.length})`}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    addMember({ firstName: "", lastName: "", birthDate: undefined })
                  }
                  disabled={isCreating}
                  className="btn btn-ghost btn-xs text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add
                </button>
              </div>

              {memberFields.length === 0 && (
                <p className="py-3 text-center text-xs text-base-content/50">
                  Add members now or after creation
                </p>
              )}

              <div className="space-y-2">
                {memberFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 rounded-lg border border-base-300 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-base-content/50">
                        Member {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(idx)}
                        disabled={isCreating}
                        className="btn btn-circle btn-ghost btn-xs text-error"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        {...register(`members.${idx}.firstName`, {
                          required: true,
                        })}
                        placeholder="First name"
                        className="input input-bordered input-sm"
                        disabled={isCreating}
                      />
                      <input
                        {...register(`members.${idx}.lastName`, {
                          required: true,
                        })}
                        placeholder="Last name"
                        className="input input-bordered input-sm"
                        disabled={isCreating}
                      />
                    </div>
                    <Controller
                      name={`members.${idx}.birthDate`}
                      control={control}
                      render={({ field: f }) => (
                        <DatePicker
                          value={f.value ? dayjs(f.value) : null}
                          format="MM/DD/YYYY"
                          placeholder="Birthday (optional)"
                          className="input input-bordered input-sm w-full"
                          onChange={(d) =>
                            f.onChange(d?.toISOString() ?? undefined)
                          }
                          disabled={isCreating}
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-base-300 p-4">
            <button
              type="submit"
              disabled={!isValid || isCreating}
              className="btn btn-primary btn-sm w-full"
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
        </form>
      </div>
    </>
  );
};

// ── Pass Card ─────────────────────────────────────────────────────────

const PassCard = ({
  pass,
  isSelected,
  onClick,
}: {
  pass: Pass;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`card border-l-4 bg-base-100 ${cardBorder(pass.label)} text-left transition-all duration-150 ${
      isSelected
        ? "ring-2 ring-primary/30 shadow-lg"
        : "shadow-sm hover:shadow-md"
    }`}
  >
    <div className="card-body p-4">
      <div className="flex items-center gap-3">
        <div className="avatar placeholder">
          <div className={`w-10 rounded-lg ${avatarColor(pass.label)}`}>
            <span className="text-sm font-bold">
              {pass.label.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold leading-tight">
            {pass.label}
          </h2>
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <span>Season {pass.season}</span>
            <span>·</span>
            <span>
              {pass.patrons.length}{" "}
              {pass.patrons.length === 1 ? "member" : "members"}
            </span>
          </div>
        </div>
      </div>

      {pass.patrons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pass.patrons.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-base-200/60 px-2.5 py-0.5 text-xs font-medium capitalize"
            >
              <span
                className="inline-block h-2 w-2 rounded-full bg-base-content/20"
              />
              {p.firstName} {p.lastName}
            </span>
          ))}
          {pass.patrons.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-base-200/60 px-2.5 py-0.5 text-xs font-medium">
              +{pass.patrons.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  </button>
);

// ── Main Page ─────────────────────────────────────────────────────────

function PassesPage() {
  const currentYear = new Date().getFullYear().toString();

  const [filter, setFilter] = useState("");
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [showNewPass, setShowNewPass] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [showShortcuts, setShowShortcuts] = useState(false);

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
  const selectedPass = data?.find((p) => p.id === selectedPassId);

  // ── Copy to current year ──────────────────────────────────────────

  const ctx = api.useUtils();
  const { mutate: copyPassToCurrentYear, isLoading: isCopying } =
    api.passes.copySeasonPassToCurrentYear.useMutation({
      onSuccess: (newPass) => {
        toast.success(`Pass "${newPass.label}" renewed for ${currentYear}!`);
        void ctx.passes.getAll.invalidate();
      },
      onError: handleApiError,
    });

  const handleCopyToCurrentYear = (passId: string, passLabel: string) => {
    if (
      confirm(
        `Renew "${passLabel}" for ${currentYear}? This creates a new pass with the same members.`,
      )
    ) {
      copyPassToCurrentYear({ passId });
    }
  };

  // ── Keyboard Shortcuts ────────────────────────────────────────────

  const shortcutGroups = useMemo(
    () => [
      {
        title: "Navigation",
        shortcuts: [
          { keys: "/", description: "Focus search" },
          { keys: "Esc", description: "Close drawer" },
        ],
      },
      {
        title: "Actions",
        shortcuts: [{ keys: "N", description: "New pass" }],
      },
      {
        title: "Help",
        shortcuts: [{ keys: "?", description: "Toggle this help" }],
      },
    ],
    [],
  );

  useKeyboardShortcuts(
    useMemo(
      () => [
        {
          key: "?",
          shift: true,
          handler: () => setShowShortcuts((v) => !v),
        },
        {
          key: "Escape",
          global: true,
          handler: () => {
            if (showShortcuts) {
              setShowShortcuts(false);
            } else if (showNewPass) {
              setShowNewPass(false);
            } else if (selectedPassId) {
              setSelectedPassId(null);
            }
          },
        },
        {
          key: "/",
          handler: () => {
            if (!showShortcuts)
              document.getElementById("pass-filter")?.focus();
          },
        },
        {
          key: "n",
          handler: () => {
            if (!showShortcuts && !showNewPass && !selectedPassId)
              setShowNewPass(true);
          },
        },
      ],
      [showShortcuts, showNewPass, selectedPassId],
    ),
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <PageLayout>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="flex h-full w-full flex-col">
          {/* Header Banner */}
          <div className="bg-primary px-6 py-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Season Passes
                </h1>
                <p className="mt-1 text-sm font-medium text-white/80">
                  {data?.length ?? 0} passes · {data?.reduce((a, p) => a + p.patrons.length, 0) ?? 0} total members
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewPass(true)}
                  className="btn btn-sm border-none bg-white text-primary shadow-sm hover:bg-white/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New Pass
                  <kbd className="kbd kbd-xs border-white/30 bg-primary/10 text-primary/70 hidden sm:inline">N</kbd>
                </button>
                <div className="tooltip tooltip-bottom" data-tip="Keyboard shortcuts (?)">
                  <button
                    className="btn btn-circle btn-sm border-white/20 bg-white/20 text-white hover:bg-white/30"
                    onClick={() => setShowShortcuts((v) => !v)}
                  >
                    ?
                  </button>
                </div>
              </div>
            </div>

            {/* Search & season filter */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60">
                  <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
                </svg>
                <input
                  id="pass-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  type="text"
                  className="input w-full border-white/20 bg-white/20 pl-10 text-white placeholder:text-white/50 focus:border-white/40 focus:bg-white/30 focus:outline-none"
                  placeholder="Search passes or members..."
                />
              </div>

              {availableSeasons && availableSeasons.length > 0 && (
                <select
                  id="season-filter"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="select select-sm border-white/20 bg-white/20 text-white [&>option]:bg-base-100 [&>option]:text-base-content"
                >
                  <option value="">All Seasons</option>
                  {availableSeasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Pass List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredPasses && filteredPasses.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPasses.map((pass) => (
                  <PassCard
                    key={pass.id}
                    pass={pass}
                    isSelected={selectedPassId === pass.id}
                    onClick={() => setSelectedPassId(pass.id)}
                  />
                ))}
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
                      onClick={() => setShowNewPass(true)}
                      className="btn btn-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Create First Pass
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawers */}
      {showNewPass && (
        <NewPassDrawer
          currentYear={currentYear}
          onClose={() => setShowNewPass(false)}
        />
      )}
      {selectedPass && (
        <EditPassDrawer
          key={selectedPass.id}
          pass={selectedPass}
          isAdmin={isAdmin}
          currentYear={currentYear}
          onClose={() => setSelectedPassId(null)}
          onCopy={handleCopyToCurrentYear}
          isCopying={isCopying}
        />
      )}
      {showShortcuts && (
        <KeyboardShortcutsHelp
          groups={shortcutGroups}
          onClose={() => setShowShortcuts(false)}
        />
      )}
    </PageLayout>
  );
}

export default isAuth(PassesPage, "employee");
