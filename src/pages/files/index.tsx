import { type _Object } from "@aws-sdk/client-s3";
import dayjs from "dayjs";
import { useState } from "react";
import { Document, Page } from "react-pdf";
import Image from "next/image";
import { PageLayout } from "~/components/layout";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { api } from "~/utils/api";

const FileView = (props: { imgKey: string; onClose: () => void }) => {
  console.log("view", props.imgKey);
  const { data, isLoading } = api.documents.getSignedUrl.useQuery({
    key: props.imgKey,
  });

  //   <Image width={500} height={500} alt="File storage" src={data} />
  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        {isLoading || !data ? (
          <LoadingSpinner />
        ) : (
          <Document file={data}>
            <Page />
          </Document>
        )}

        <div className="flex flex-row justify-end">
          <button className="btn" onClick={props.onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
};

const FileButton = (props: { imgKey: string }) => {
  const [show, setShow] = useState(false);
  console.log("button", props.imgKey);

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
      <table className="table table-zebra mt-2">
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
    </PageLayout>
  );
}
