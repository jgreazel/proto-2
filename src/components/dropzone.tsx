import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

import { api } from "../utils/api";

// todo make generic
export const Dropzone = () => {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const { mutateAsync: fetchPresignedUrls } =
    api.documents.getStandardUploadPresignedUrl.useMutation();
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const apiUtils = api.useContext();

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      accept: { "image/jpeg": [".jpeg", ".png"], "text/html": [".pdf"] },
      maxFiles: 1,
      maxSize: 5 * 2 ** 30, // roughly 5GB
      multiple: false,
      onDropAccepted: (files, _event) => {
        const file = files[0] as File;

        fetchPresignedUrls({
          key: file.name,
        })
          .then((url) => {
            setPresignedUrl(url);
            setSubmitDisabled(false);
          })
          .catch((err) => console.error(err));
      },
    });

  const files = useMemo(() => {
    if (!submitDisabled)
      return acceptedFiles.map((file) => (
        <li key={file.name}>
          {file.name} - {file.size} bytes
        </li>
      ));
    return null;
  }, [acceptedFiles, submitDisabled]);

  const handleSubmit = useCallback(async () => {
    if (acceptedFiles.length > 0 && presignedUrl !== null) {
      const file = acceptedFiles[0]!;
      await axios
        .put(presignedUrl, file.slice(), {
          headers: {
            "Content-Type": file.type,
          },
        })
        .then((response) => {
          console.log(response);
          console.log("Successfully uploaded ", file.name);
        })
        .catch((err) => console.error(err));
      setSubmitDisabled(true);
      await apiUtils.documents.getAll.invalidate();
    }
  }, [acceptedFiles, apiUtils.documents.getAll, presignedUrl]);

  return (
    <section>
      <h2 className="text-lg font-semibold">File Upload</h2>
      <p className="mb-3">Upload files and documents for storage.</p>
      <div {...getRootProps()} className="dropzone-container">
        <input {...getInputProps()} />

        <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-base-200 p-4 font-semibold">
          <p>
            {isDragActive
              ? "Drop the file here..."
              : "Drag n drop file here, or click to select files"}
          </p>
        </div>
      </div>
      <aside className="my-2">
        <h4 className="font-semibold text-zinc-400">Files pending upload</h4>
        <ul>{files}</ul>
      </aside>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => void handleSubmit()}
        disabled={
          presignedUrl === null || acceptedFiles.length === 0 || submitDisabled
        }
      >
        Upload
      </button>
    </section>
  );
};
