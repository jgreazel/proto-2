import { InputNumber, Select } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import NoData from "~/components/noData";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import handleApiError from "~/helpers/handleApiError";
import moneyMask from "~/helpers/moneyMask";
import { type RouterOutputs, api } from "~/utils/api";

type HourCodeFormData = {
  id: string;
  label: string;
  hourlyRate: number;
};

const HourCodeFormModal = ({
  onClose,
  data,
}: {
  onClose: () => void;
  data?: HourCodeFormData;
}) => {
  const utils = api.useUtils();
  const onSuccess = (msg: string) => async () => {
    toast.success(msg);
    await utils.schedules.getHourCodes.invalidate();
    onClose();
  };
  const { mutate, isLoading } = api.schedules.createHourCode.useMutation({
    onSuccess: onSuccess("Created!"),
    onError: handleApiError,
  });
  const { mutate: update, isLoading: isUpdating } =
    api.schedules.editHourCode.useMutation({
      onSuccess: onSuccess("Updated!"),
      onError: handleApiError,
    });
  const { mutate: apiDelete, isLoading: isDeleting } =
    api.schedules.deleteHourCode.useMutation({
      onSuccess: onSuccess("Deleted!"),
      onError: handleApiError,
    });

  const [title, setTitle] = useState(data?.label ?? "");
  const [rate, setRate] = useState(data?.hourlyRate ?? 0);

  const handleClick = () => {
    const toSubmit = {
      label: title,
      hourlyRate: rate,
    };
    !!data ? update({ ...toSubmit, id: data.id }) : mutate(toSubmit);
  };

  const cantSubmit =
    title === "" || rate === 0 || isLoading || isUpdating || isDeleting;
  const primaryText = !!data ? "Update" : "Create";

  return (
    <dialog id="new-hour-code-modal" className="modal modal-open">
      <div className="modal-box">
        <form method="dialog">
          <button
            onClick={onClose}
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
          </button>
        </form>
        <div id="modal-content">
          <h4 className="text-lg font-medium">New Hour Code</h4>
          <div className="flex items-center gap-1">
            <label htmlFor="title" className="label">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="input input-sm input-bordered grow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
            <label htmlFor="title" className="label">
              Hourly Rate
            </label>
            <InputNumber
              {...moneyMask}
              placeholder="$0.00"
              min={0}
              value={rate}
              onChange={(v) => setRate(v ?? 0)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="modal-action">
          {!!data && (
            <button
              onClick={() => apiDelete({ id: data.id })}
              // todo disabled if used by any users
              disabled={cantSubmit}
              className="btn btn-outline btn-accent"
            >
              Delete
            </button>
          )}
          <button
            disabled={cantSubmit}
            className="btn btn-primary"
            onClick={handleClick}
          >
            {primaryText}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

const HourCodeListModal = ({ onClose }: { onClose: () => void }) => {
  const [showNew, setShowNew] = useState(false);
  const [modalData, setModalData] = useState<
    RouterOutputs["schedules"]["getHourCodes"][number] | undefined
  >(undefined);
  const { data, isLoading } = api.schedules.getHourCodes.useQuery();

  return (
    <>
      <dialog id="hour-code-modal" className="modal modal-open">
        <div className="modal-box">
          <form method="dialog">
            <button
              onClick={onClose}
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
            </button>
          </form>
          <div id="modal-content">
            <h4 className="text-lg font-medium">Hour Codes</h4>
            {isLoading ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Hourly Rate</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((x) => (
                    <tr key={x.id}>
                      <td className="capitalize">{x.label}</td>
                      <td>{dbUnitToDollars(x.hourlyRate)}</td>
                      <td>
                        <button
                          className="btn btn-circle btn-ghost btn-sm"
                          onClick={() => setModalData(x)}
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
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="modal-action justify-start">
            <button className="btn" onClick={() => setShowNew(true)}>
              New Hour Code
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>close</button>
        </form>
      </dialog>
      {showNew && <HourCodeFormModal onClose={() => setShowNew(false)} />}
      {!!modalData && (
        <HourCodeFormModal
          onClose={() => setModalData(undefined)}
          data={modalData}
        />
      )}
    </>
  );
};

type UserFormData = {
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  email: string;
};

const NewUserModal = ({ onClose }: { onClose: () => void }) => {
  const { register, handleSubmit, reset, formState } = useForm<UserFormData>();
  const ctx = api.useUtils();

  // todo fix clerk server code...
  const { mutate, isLoading } = api.profile.createUser.useMutation({
    onSuccess: async () => {
      toast.success("Created!");
      await ctx.profile.getUsers.invalidate();
      reset();
      onClose();
    },
    onError: handleApiError,
  });

  const handleFormSubmit = (data: UserFormData) => {
    mutate({ ...data, email: !!data.email ? data.email : null });
  };

  return (
    <dialog id="hour-code-modal" className="modal modal-open">
      <div className="modal-box">
        <form method="dialog">
          <button
            onClick={onClose}
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
          </button>
        </form>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div id="modal-content" className="flex flex-col gap-2">
            <h4 className="text-lg font-medium">New User</h4>
            <label className="text-xs font-medium">First Name</label>
            <input
              id="firstname"
              type="text"
              placeholder="Ex: John"
              className="input input-bordered"
              {...register("firstname", {
                required: true,
                disabled: isLoading,
              })}
            />
            <label className="text-xs font-medium">Last Name</label>
            <input
              id="lastname"
              type="text"
              placeholder="Ex: Doe"
              className="input input-bordered"
              {...register("lastname", {
                required: true,
                disabled: isLoading,
              })}
            />

            <label className="text-xs font-medium">Username</label>
            <input
              id="username"
              type="text"
              className="input input-bordered"
              {...register("username", {
                required: true,
                disabled: isLoading,
              })}
            />
            <label className="text-xs font-medium">Password</label>
            <input
              id="password"
              type="text"
              className="input input-bordered"
              {...register("password", {
                required: true,
                disabled: isLoading,
                min: 8,
              })}
            />
            <label className="form-control">
              <div className="label">
                <span className="text-xs font-medium">Email</span>
              </div>
              <input
                id="email"
                type="text"
                placeholder="Ex: name@example.com"
                className="input input-bordered"
                {...register("email", {
                  disabled: isLoading,
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email format",
                  },
                })}
              />
              <div className="label">
                {formState.errors.email && (
                  <span className="label-text-alt">
                    {formState.errors.email.message}
                  </span>
                )}
              </div>
            </label>
          </div>
          <div className="modal-action justify-end">
            <button
              disabled={!formState.isValid}
              className="btn btn-primary"
              type="submit"
            >
              Create
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

const OptionsButton = () => {
  const [showHC, setShowHC] = useState(false);
  const [showUser, setShowUser] = useState(false);

  return (
    <>
      {showHC && <HourCodeListModal onClose={() => setShowHC(false)} />}
      {showUser && <NewUserModal onClose={() => setShowUser(false)} />}
      <details className="dropdown dropdown-end">
        <summary className="btn btn-circle btn-ghost m-1">
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
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </summary>
        <ul className="menu dropdown-content z-[1] w-max rounded-box bg-base-200 p-2 shadow-xl">
          <li>
            <span onClick={() => setShowHC(true)}>
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Manage Hour Codes
            </span>
          </li>
          <li>
            <span onClick={() => setShowUser(true)}>
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              New User
            </span>
          </li>
        </ul>
      </details>
    </>
  );
};

const UserPermissionsModal = ({
  onClose,
  data,
  userId,
}: {
  onClose: () => void;
  data?: { defaultHourCodeId: string; canModifyHourCode: boolean };
  userId: string;
}) => {
  const [select, setSelect] = useState(data?.defaultHourCodeId ?? "");
  const [canModify, setCanModify] = useState<boolean>(
    !!data?.canModifyHourCode,
  );

  const { data: hcOpts, isLoading: gettingHCs } =
    api.schedules.getHourCodes.useQuery();

  const utils = api.useUtils();
  const onSuccess = (msg: string) => async () => {
    toast.success(msg);
    await utils.profile.getUsers.invalidate();
    onClose();
  };
  const { mutate: create, isLoading } = api.profile.createSettings.useMutation({
    onSuccess: onSuccess("Created!"),
    onError: handleApiError,
  });
  const { mutate: update, isLoading: isUpdating } =
    api.profile.updateSettings.useMutation({
      onSuccess: onSuccess("Updated!"),
      onError: handleApiError,
    });

  const isGray = isLoading || gettingHCs || isUpdating;

  const options = hcOpts?.map((x) => ({
    label: `${x.label} - ${dbUnitToDollars(x.hourlyRate)}`,
    value: x.id,
  }));
  options?.unshift({ value: "", label: "---" });

  const handleSubmit = () => {
    const input = {
      userId,
      defaultHourCodeId: select,
      canModifyHourCode: canModify,
    };
    !!data ? update(input) : create(input);
  };

  return (
    <dialog id="new-hour-code-modal" className="modal modal-open">
      <div className="modal-box">
        <form method="dialog">
          <button
            onClick={onClose}
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
          </button>
        </form>
        <div id="modal-content" className="flex flex-col gap-2">
          <h3 className="text-large font-medium">User Permissions</h3>
          <div>
            <label className="label w-fit cursor-pointer gap-2">
              <span className="text-label">
                May clock in with any hour code
              </span>
              <input
                type="checkbox"
                className="checkbox"
                checked={canModify}
                onChange={(v) => setCanModify(v.target.checked)}
                disabled={isGray}
              />
            </label>
          </div>
          <div>
            <div className="text-label">Default Hour Code</div>
            <Select
              className="h-10 w-full"
              value={select}
              onChange={(newValue) => {
                setSelect(newValue);
              }}
              options={options}
              disabled={isGray}
            />
          </div>
        </div>
        <div className="modal-action">
          <button
            disabled={isGray || select === ""}
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            {!data ? "Create" : "Update"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

const UserTable = ({ filter }: { filter: string }) => {
  const { data, isLoading } = api.profile.getUsers.useQuery();
  const [modalId, setModalId] = useState<string | undefined>(undefined);

  const ss = data?.find((u) => u.id === modalId)?.settings;
  const modal = (
    <UserPermissionsModal
      userId={modalId!}
      onClose={() => setModalId(undefined)}
      data={
        !!ss
          ? {
              defaultHourCodeId: ss.defaultHourCodeId ?? "",
              canModifyHourCode: !!ss.canModifyHourCode,
            }
          : undefined
      }
    />
  );

  const isIn = (val?: string | null) =>
    val?.toUpperCase().includes(filter.toUpperCase()) ?? false;

  return isLoading ? (
    <span className="loading loading-spinner loading-md"></span>
  ) : (
    <>
      <table className="table table-zebra rounded-lg shadow-lg">
        <thead>
          <tr>
            <th>Username</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Permissions</th>
          </tr>
        </thead>
        <tbody>
          {data
            ?.filter(
              (x) => isIn(x.username) || isIn(x.firstName) || isIn(x.lastName),
            )
            .map((x) => {
              const isEdit = !!x.settings;
              return (
                <tr key={x.id}>
                  <td>{x.username}</td>
                  <td className="capitalize">{x.firstName ?? "-"}</td>
                  <td className="capitalize">{x.lastName ?? "-"}</td>
                  <td>
                    {
                      <div
                        className="tooltip"
                        data-tip={
                          isEdit ? "Edit Permissions" : "Create Permissions"
                        }
                      >
                        <button
                          onClick={() => setModalId(x.id)}
                          className="btn btn-circle btn-ghost btn-sm"
                        >
                          {isEdit ? (
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
                                d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
                              />
                            </svg>
                          ) : (
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
                                d="M12 4.5v15m7.5-7.5h-15"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {!!modalId && modal}
    </>
  );
};

export default function UsersPage() {
  const [filter, setFilter] = useState("");

  return (
    <PageLayout>
      <div className="p-2">
        <div className="flex flex-row gap-2">
          <label
            htmlFor="user-filter"
            className="input input-bordered m-1 flex grow items-center gap-2"
          >
            <input
              id="user-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              type="text"
              className="grow"
              placeholder="Search"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
          </label>
          <OptionsButton />
        </div>
        <UserTable filter={filter} />
      </div>
    </PageLayout>
  );
}
