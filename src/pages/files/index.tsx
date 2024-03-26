import dayjs from "dayjs";
import { useState } from "react";
import { Dropzone } from "~/components/dropzone";
import { PageLayout } from "~/components/layout";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { api } from "~/utils/api";

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

const FileButton = (props: { imgKey: string }) => {
  const [show, setShow] = useState(false);

  return (
    <>
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

      {show && (
        <FileView imgKey={props.imgKey} onClose={() => setShow(false)} />
      )}
    </>
  );
};

export default function FilesPage() {
  const { data, isLoading } = api.documents.getAll.useQuery();

  if (isLoading || !data) {
    return <LoadingPage />;
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-2 p-2">
        <div className="rounded-lg p-4 shadow-lg">
          <Dropzone />
        </div>
        <table className="table table-zebra mt-2 rounded-lg shadow-lg">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Last Modified</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((x) => (
              <tr key={x.ETag}>
                <td>{x.Key}</td>
                <td>{dayjs(x.LastModified).format("MM/DD/YYYY HH:mm")}</td>
                <td>
                  <FileButton imgKey={x.Key ?? ""} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
