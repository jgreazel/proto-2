import { InputNumber } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { Dropzone } from "~/components/dropzone";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
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
              disabled={cantSubmit}
              className="btn btn-accent"
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

const OptionsButton = () => {
  const [showHC, setShowHC] = useState(false);

  return (
    <>
      {showHC && <HourCodeListModal onClose={() => setShowHC(false)} />}
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
            <span
              onClick={() => {
                // todo: open new user modal
              }}
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

export default function UsersPage() {
  const { data, isLoading } = api.documents.getAll.useQuery();
  const [filter, setFilter] = useState("");

  if (isLoading || !data) {
    return <LoadingPage />;
  }

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
      </div>
    </PageLayout>
  );
}
