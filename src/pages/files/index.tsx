import dayjs from "dayjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { Dropzone } from "~/components/dropzone";
import { PageLayout } from "~/components/layout";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

const DeleteDialog = (props: { imgKey: string; onClose: () => void }) => {
  const { mutate, isLoading } = api.documents.deleteItem.useMutation();
  const utils = api.useUtils();

  const handleDelete = async () => {
    mutate(
      {
        key: props.imgKey,
      },
      {
        onSuccess: () => {
          toast.error("Successfully Deleted");
          props.onClose();
        },
        onError: handleApiError,
      },
    );
    await utils.documents.getAll.invalidate();
  };

  return (
    <dialog className="modal modal-open">
      <form method="dialog" className="modal-backdrop">
        <button onClick={props.onClose}>close</button>
      </form>
      <div className="modal-box">
        <form method="dialog">
          <button
            onClick={props.onClose}
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
        <div className="card-body items-center text-center">
          <div className="card-title">Delete File?</div>
          <p>Deleting files cannot be undone.</p>
          <div className="card-actions justify-between">
            <button
              disabled={isLoading}
              className="btn btn-ghost"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <button
              disabled={isLoading}
              className="btn btn-accent"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

const FileView = (props: { imgKey: string; onClose: () => void }) => {
  const { data, isLoading } = api.documents.getSignedUrl.useQuery({
    key: props.imgKey,
  });

  return (
    <dialog className="modal modal-open">
      <form method="dialog" className="modal-backdrop">
        <button onClick={props.onClose}>close</button>
      </form>
      <div className="modal-box h-full w-full">
        <form method="dialog">
          <button
            onClick={props.onClose}
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
        {isLoading || !data ? (
          <LoadingSpinner />
        ) : (
          <embed className="h-full w-full" type="application/pdf" src={data} />
        )}
      </div>
    </dialog>
  );
};

const FileColumn = (props: { imgKey: string }) => {
  const [show, setShow] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="flex flex-row gap-2">
      <div className="tooltip" data-tip="Delete">
        <button
          onClick={() => setShowDelete(true)}
          className="btn btn-square btn-outline btn-accent btn-sm"
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
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      </div>
      <div className="tooltip" data-tip="View">
        <button
          onClick={() => setShow(true)}
          className="btn btn-square btn-outline btn-secondary btn-sm"
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
              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </button>
      </div>

      {show && (
        <FileView imgKey={props.imgKey} onClose={() => setShow(false)} />
      )}

      {showDelete && (
        <DeleteDialog
          imgKey={props.imgKey}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
};

export default function FilesPage() {
  const { data, isLoading } = api.documents.getAll.useQuery();

  if (isLoading || !data) {
    return <LoadingPage />;
  }

  return (
    <PageLayout>
      <div className="card card-compact flex flex-col gap-2 bg-base-200 p-2">
        <div className="card-body">
          <div className="card card-compact rounded-lg bg-base-100 shadow-lg">
            <div className="card-body">
              <Dropzone />
            </div>
          </div>
          <table className="table table-zebra mt-2 rounded-lg bg-base-100 shadow-lg">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((x) => (
                <tr key={x.ETag}>
                  <td>{x.Key}</td>
                  <td>{dayjs(x.LastModified).format("MM/DD/YYYY, h:mm A")}</td>
                  <td>
                    <FileColumn imgKey={x.Key ?? ""} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
