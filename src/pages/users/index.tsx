import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

// ── Types ──────────────────────────────────────────────

type UserWithSettings = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl?: string | null;
  membership?: {
    id: string;
    organizationId: string;
    role: string;
    isAdmin: boolean;
    isPinOnly: boolean;
    isSystemAccount: boolean;
    displayName: string;
    pin: string | null;
  };
  settings?: {
    isAdmin: boolean;
  } | null;
};

type CreateFormData = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  isAdmin: boolean;
};

type EditFormData = {
  isAdmin: boolean;
};

// ── Panel: Empty State ─────────────────────────────────

const EmptyPanel = () => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-base-content/40">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
      className="h-12 w-12"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
    <p className="text-sm">Select a user to edit, or create a new one.</p>
  </div>
);

// ── Panel: Create User ─────────────────────────────────

const CreatePanel = ({ onDone }: { onDone: () => void }) => {
  const { register, handleSubmit, reset, formState } =
    useForm<CreateFormData>({
      mode: "onChange",
      defaultValues: { isAdmin: false },
    });
  const utils = api.useUtils();

  const { mutate, isLoading } = api.profile.createUser.useMutation({
    onSuccess: async () => {
      toast.success("User created!");
      await utils.profile.getUsers.invalidate();
      reset();
      onDone();
    },
    onError: handleApiError,
  });

  const onSubmit = (d: CreateFormData) => {
    mutate({
      firstName: d.firstName,
      lastName: d.lastName,
      username: d.username,
      password: d.password,
      email: d.email || null,
      isAdmin: d.isAdmin,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
    >
      <h2 className="text-lg font-bold">New User</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">First Name</label>
          <input
            type="text"
            placeholder="John"
            className="input input-bordered input-sm"
            {...register("firstName", {
              required: "Required",
              disabled: isLoading,
            })}
          />
          {formState.errors.firstName && (
            <span className="text-xs text-error">
              {formState.errors.firstName.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Last Name</label>
          <input
            type="text"
            placeholder="Doe"
            className="input input-bordered input-sm"
            {...register("lastName", {
              required: "Required",
              disabled: isLoading,
            })}
          />
          {formState.errors.lastName && (
            <span className="text-xs text-error">
              {formState.errors.lastName.message}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Username</label>
        <input
          type="text"
          className="input input-bordered input-sm"
          {...register("username", {
            required: "Required",
            disabled: isLoading,
          })}
        />
        {formState.errors.username && (
          <span className="text-xs text-error">
            {formState.errors.username.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Email (optional)</label>
        <input
          type="text"
          placeholder="name@example.com"
          className="input input-bordered input-sm"
          {...register("email", {
            disabled: isLoading,
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Invalid email",
            },
          })}
        />
        {formState.errors.email && (
          <span className="text-xs text-error">
            {formState.errors.email.message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Password</label>
          <input
            type="password"
            className="input input-bordered input-sm"
            {...register("password", {
              required: "Required",
              disabled: isLoading,
              minLength: { value: 8, message: "Min 8 characters" },
            })}
          />
          {formState.errors.password && (
            <span className="text-xs text-error">
              {formState.errors.password.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Confirm Password</label>
          <input
            type="password"
            className="input input-bordered input-sm"
            {...register("confirmPassword", {
              required: "Required",
              disabled: isLoading,
              validate: (v, fv) =>
                v === fv.password || "Passwords don't match",
            })}
          />
          {formState.errors.confirmPassword && (
            <span className="text-xs text-error">
              {formState.errors.confirmPassword.message}
            </span>
          )}
        </div>
      </div>

      <label className="label mt-1 w-fit cursor-pointer gap-3 rounded-lg border border-base-300 px-3 py-2">
        <input
          type="checkbox"
          className="toggle toggle-sm toggle-primary"
          {...register("isAdmin")}
          disabled={isLoading}
        />
        <div>
          <span className="label-text font-medium">Admin</span>
          <p className="text-xs text-base-content/50">
            Full access to items, files, reports &amp; user management
          </p>
        </div>
      </label>

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!formState.isValid || isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Create User"
          )}
        </button>
      </div>
    </form>
  );
};

// ── Panel: Edit User ───────────────────────────────────

const PinSection = ({
  userId,
  hasPin,
}: {
  userId: string;
  hasPin: boolean;
}) => {
  const utils = api.useUtils();
  const [pinInput, setPinInput] = useState("");
  const [mode, setMode] = useState<"view" | "set">("view");

  const { mutate: updatePin, isLoading } = api.profile.updateMemberPin.useMutation({
    onSuccess: async () => {
      toast.success(pinInput ? "PIN set!" : "PIN cleared!");
      await utils.profile.getUsers.invalidate();
      setPinInput("");
      setMode("view");
    },
    onError: handleApiError,
  });

  if (mode === "view") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-base-300 px-3 py-2">
        <div>
          <span className="label-text font-medium">Time Clock PIN</span>
          <p className="text-xs text-base-content/50">
            {hasPin ? "PIN is set — employee can clock in/out" : "No PIN — employee cannot use time clock"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPin && (
            <span className="badge badge-success badge-sm">Set</span>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setMode("set")}
          >
            {hasPin ? "Change" : "Set PIN"}
          </button>
          {hasPin && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-error"
              disabled={isLoading}
              onClick={() => updatePin({ userId, pin: null })}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
      <span className="label-text font-medium">Set Time Clock PIN</span>
      <p className="text-xs text-base-content/50">Enter a 4-digit numeric PIN</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="0000"
          className="input input-bordered input-sm w-24 font-mono tracking-widest"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={pinInput.length !== 4 || isLoading}
          onClick={() => updatePin({ userId, pin: pinInput })}
        >
          {isLoading ? <span className="loading loading-spinner loading-xs" /> : "Save"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { setPinInput(""); setMode("view"); }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const EditPanel = ({
  user,
  onDone,
}: {
  user: UserWithSettings;
  onDone: () => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const utils = api.useUtils();

  const { register, handleSubmit, formState } = useForm<EditFormData>({
    mode: "onChange",
    defaultValues: {
      isAdmin: user.settings?.isAdmin ?? false,
    },
  });

  const { mutate: updateSettings, isLoading: isUpdating } =
    api.profile.updateSettings.useMutation({
      onSuccess: async () => {
        toast.success("Settings updated!");
        await utils.profile.getUsers.invalidate();
      },
      onError: handleApiError,
    });

  const { mutate: deleteUser, isLoading: isDeleting } =
    api.profile.deleteUser.useMutation({
      onSuccess: async () => {
        toast.success(`${user.firstName ?? "User"} deleted`);
        await utils.profile.getUsers.invalidate();
        onDone();
      },
      onError: handleApiError,
    });

  const isBusy = isUpdating || isDeleting;

  const onSubmit = (d: EditFormData) => {
    updateSettings({
      userId: user.id,
      isAdmin: d.isAdmin,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold capitalize">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-base-content/60">@{user.username}</p>
        </div>
        {user.settings?.isAdmin && (
          <div className="badge badge-primary badge-sm">Admin</div>
        )}
        {!user.settings && (
          <div className="badge badge-warning badge-sm">No settings</div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <label className="label w-fit cursor-pointer gap-3 rounded-lg border border-base-300 px-3 py-2">
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-primary"
            {...register("isAdmin")}
            disabled={isBusy}
          />
          <div>
            <span className="label-text font-medium">Admin</span>
            <p className="text-xs text-base-content/50">
              Full access to items, files, reports &amp; user management
            </p>
          </div>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!formState.isDirty || !formState.isValid || isBusy}
          >
            {isUpdating ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Save"
            )}
          </button>
        </div>
      </form>

      <PinSection
        userId={user.id}
        hasPin={!!user.membership?.pin}
      />

      <div className="divider my-0 text-xs text-error/60">Danger Zone</div>

      {!showDeleteConfirm ? (
        <button
          className="btn btn-outline btn-error btn-sm w-fit"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isBusy}
        >
          Delete User
        </button>
      ) : (
        <div className="rounded-lg border border-error/30 bg-error/5 p-3">
          <p className="mb-3 text-sm">
            Permanently delete{" "}
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            ? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              className="btn btn-error btn-sm"
              onClick={() => deleteUser({ userId: user.id })}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Yes, Delete"
              )}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── User List Sidebar ──────────────────────────────────

const UserListItem = ({
  user,
  isSelected,
  onClick,
}: {
  user: UserWithSettings;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
      isSelected
        ? "bg-primary/10 text-primary"
        : "hover:bg-base-200"
    }`}
  >
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-300 text-xs font-bold uppercase">
      {user.firstName?.[0]}
      {user.lastName?.[0]}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium capitalize">
        {user.firstName} {user.lastName}
      </p>
      <p className="truncate text-xs text-base-content/50">
        @{user.username}
      </p>
    </div>
    {user.settings?.isAdmin && (
      <div className="badge badge-primary badge-xs">Admin</div>
    )}
  </button>
);

// ── Back Button (mobile detail view) ───────────────────

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="btn btn-ghost btn-sm mb-2 gap-1 self-start lg:hidden"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5 8.25 12l7.5-7.5"
      />
    </svg>
    Back
  </button>
);

// ── Main Page ──────────────────────────────────────────

function UsersPage() {
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");

  const { data: users, isLoading } = api.profile.getUsers.useQuery();

  const selectedUser = users?.find((u) => u.id === selectedId);

  const isIn = (val?: string | null) =>
    val?.toUpperCase().includes(filter.toUpperCase()) ?? false;
  const filteredUsers = users?.filter(
    (x) => isIn(x.username) || isIn(x.firstName) || isIn(x.lastName),
  );

  const handleSelectUser = (id: string) => {
    setSelectedId(id);
    setMode("edit");
  };

  const handleNewUser = () => {
    setSelectedId(undefined);
    setMode("create");
  };

  const handleDone = () => {
    setSelectedId(undefined);
    setMode("idle");
  };

  // On mobile, when a panel is active we show it instead of the list
  const panelActive = mode !== "idle";

  return (
    <PageLayout>
      <div className="flex h-full flex-col p-4 lg:flex-row lg:gap-6 lg:p-6">
        {/* ── Left: User List (hidden on mobile when panel is open) ── */}
        <div
          className={`flex flex-col gap-3 ${
            panelActive ? "hidden lg:flex" : "flex"
          } lg:w-64 lg:shrink-0`}
        >
          <button
            onClick={handleNewUser}
            className="btn btn-primary btn-sm w-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New User
          </button>

          <label className="input input-bordered input-sm flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-50"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              type="text"
              className="grow"
              placeholder="Search users…"
            />
          </label>

          {filter && (
            <p className="text-xs text-base-content/50">
              {filteredUsers?.length ?? 0} of {users?.length ?? 0} users
            </p>
          )}

          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {isLoading ? (
              <LoadingPage />
            ) : (
              filteredUsers?.map((u) => (
                <UserListItem
                  key={u.id}
                  user={u}
                  isSelected={selectedId === u.id && mode === "edit"}
                  onClick={() => handleSelectUser(u.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Detail Panel (full-width on mobile, constrained on desktop) ── */}
        <div
          className={`min-w-0 flex-1 overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg sm:p-6 lg:max-w-md ${
            panelActive ? "flex flex-col" : "hidden lg:flex lg:flex-col"
          }`}
        >
          {panelActive && <BackButton onClick={handleDone} />}
          {mode === "idle" && <EmptyPanel />}
          {mode === "create" && <CreatePanel onDone={handleDone} />}
          {mode === "edit" && selectedUser && (
            <EditPanel
              key={selectedUser.id}
              user={selectedUser}
              onDone={handleDone}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default isAuth(UsersPage, "admin");
