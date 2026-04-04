import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

import { api } from "../utils/api";
import formatFileSize from "~/helpers/formatFileSize";

export const Dropzone = ({ onUploadComplete }: { onUploadComplete?: () => void }) => {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { mutateAsync: fetchPresignedUrls } =
    api.documents.getStandardUploadPresignedUrl.useMutation();
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const apiUtils = api.useContext();

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      accept: { "image/jpeg": [".jpeg", ".png"], "text/html": [".pdf"] },
      maxFiles: 1,
      maxSize: 5 * 2 ** 30,
      multiple: false,
      onDropAccepted: (files) => {
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

  const stagedFile = useMemo(() => {
    if (!submitDisabled && acceptedFiles.length > 0) return acceptedFiles[0]!;
    return null;
  }, [acceptedFiles, submitDisabled]);

  const handleSubmit = useCallback(async () => {
    if (acceptedFiles.length > 0 && presignedUrl !== null) {
      const file = acceptedFiles[0]!;
      setIsUploading(true);
      try {
        await axios.put(presignedUrl, file.slice(), {
          headers: { "Content-Type": file.type },
        });
        setSubmitDisabled(true);
        await apiUtils.documents.getAll.invalidate();
        onUploadComplete?.();
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  }, [acceptedFiles, apiUtils.documents.getAll, presignedUrl, onUploadComplete]);

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : stagedFile
            ? "border-success bg-success/5"
            : "border-base-300 hover:border-primary/50 hover:bg-base-200/30"
        }`}
      >
        <input {...getInputProps()} />
        {stagedFile ? (
          <div className="flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25A9 9 0 0 1 19.5 11.25" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium">{stagedFile.name}</p>
              <p className="text-xs text-base-content/60">
                {formatFileSize(stagedFile.size)} — Ready to upload
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-base-content/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-base-content/60">
              {isDragActive ? "Drop file here..." : "Drop a file here or click to browse"}
            </p>
          </div>
        )}
      </div>

      {stagedFile && (
        <button
          className={`btn btn-primary btn-sm w-full ${isUploading ? "loading" : ""}`}
          onClick={() => void handleSubmit()}
          disabled={presignedUrl === null || submitDisabled || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </button>
      )}
    </div>
  );
};

