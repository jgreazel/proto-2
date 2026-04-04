import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Dropzone } from "~/components/dropzone";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import NoData from "~/components/noData";
import formatFileSize from "~/helpers/formatFileSize";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

// ---------------------------------------------------------------------------
// File type helpers
// ---------------------------------------------------------------------------

function getFileExtension(key: string): string {
  return (key.split(".").pop() ?? "").toLowerCase();
}

function getFileTypeInfo(key: string) {
  const ext = getFileExtension(key);
  switch (ext) {
    case "pdf":
      return { label: "PDF", color: "badge-error" };
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return { label: ext.toUpperCase(), color: "badge-info" };
    case "doc":
    case "docx":
      return { label: "DOC", color: "badge-primary" };
    case "xls":
    case "xlsx":
      return { label: "XLS", color: "badge-success" };
    default:
      return { label: ext.toUpperCase() || "FILE", color: "badge-ghost" };
  }
}

function isPreviewable(key: string): "pdf" | "image" | null {
  const ext = getFileExtension(key);
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  return null;
}

// ---------------------------------------------------------------------------
// Inline rename
// ---------------------------------------------------------------------------

const InlineRename = ({
  fileKey,
  onDone,
}: {
  fileKey: string;
  onDone: () => void;
}) => {
  const ext = getFileExtension(fileKey);
  const baseName = fileKey.slice(0, fileKey.length - ext.length - (ext ? 1 : 0));
  const [value, setValue] = useState(baseName);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const { mutate, isLoading } = api.documents.renameItem.useMutation({
    onSuccess: () => {
      toast.success("File renamed!");
      void utils.documents.getAll.invalidate();
      onDone();
    },
    onError: handleApiError,
  });

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === baseName) {
      onDone();
      return;
    }
    const newKey = ext ? `${trimmed}.${ext}` : trimmed;
    mutate({ oldKey: fileKey, newKey });
  };

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
        className="input input-bordered input-xs w-full max-w-[200px]"
        onBlur={handleSubmit}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
      />
      {ext && <span className="text-xs text-base-content/50">.{ext}</span>}
    </form>
  );
};

// ---------------------------------------------------------------------------
// File row in the sidebar list
// ---------------------------------------------------------------------------

const FileRow = ({
  fileKey,
  size,
  lastModified,
  isSelected,
  onSelect,
}: {
  fileKey: string;
  size: number | undefined;
  lastModified: Date | undefined;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const utils = api.useUtils();
  const typeInfo = getFileTypeInfo(fileKey);

  const { mutate: deleteFile, isLoading: isDeleting } =
    api.documents.deleteItem.useMutation({
      onSuccess: () => {
        toast.success("File deleted!");
        void utils.documents.getAll.invalidate();
        setConfirmDelete(false);
      },
      onError: handleApiError,
    });

  return (
    <div
      className={`group cursor-pointer rounded-lg border px-3 py-2.5 transition-all ${
        isSelected
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-transparent hover:bg-base-200/60"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* File type badge */}
        <div className={`badge ${typeInfo.color} badge-sm mt-0.5 shrink-0`}>
          {typeInfo.label}
        </div>

        <div className="min-w-0 flex-1">
          {/* File name or rename input */}
          {renaming ? (
            <div onClick={(e) => e.stopPropagation()}>
              <InlineRename
                fileKey={fileKey}
                onDone={() => setRenaming(false)}
              />
            </div>
          ) : (
            <p
              className="truncate text-sm font-medium"
              title={fileKey}
            >
              {fileKey}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-0.5 flex items-center gap-2 text-xs text-base-content/50">
            <span>{formatFileSize(size)}</span>
            {lastModified && (
              <>
                <span>·</span>
                <span>{dayjs(lastModified).format("MMM D, YYYY")}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons — visible on hover or when row is selected */}
        <div
          className={`flex shrink-0 items-center gap-0.5 ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } transition-opacity`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setRenaming(true)}
            className="btn btn-ghost btn-xs"
            title="Rename"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => deleteFile({ key: fileKey })}
                disabled={isDeleting}
                className="btn btn-error btn-xs"
              >
                {isDeleting ? "..." : "Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn btn-ghost btn-xs"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn btn-ghost btn-xs text-error/70 hover:text-error"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Preview panel
// ---------------------------------------------------------------------------

const FilePreview = ({ fileKey }: { fileKey: string }) => {
  const { data: signedUrl, isLoading } = api.documents.getSignedUrl.useQuery(
    { key: fileKey },
    { enabled: !!fileKey },
  );

  const previewType = isPreviewable(fileKey);

  if (isLoading || !signedUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between border-b border-base-200 px-4 py-2">
        <h3 className="truncate text-sm font-medium" title={fileKey}>
          {fileKey}
        </h3>
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-xs gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open
        </a>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto bg-base-200/30 p-2">
        {previewType === "pdf" ? (
          <embed
            className="h-full w-full rounded"
            type="application/pdf"
            src={signedUrl}
          />
        ) : previewType === "image" ? (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt={fileKey}
              className="max-h-full max-w-full rounded object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-sm">Preview not available for this file type</p>
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty preview state
// ---------------------------------------------------------------------------

const EmptyPreview = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 text-base-content/40">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-16 w-16">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
    <p className="text-sm font-medium">Select a file to preview</p>
    <p className="text-xs">Click any file on the left to view it here</p>
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function FilesPage() {
  const { data, isLoading } = api.documents.getAll.useQuery();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // Reset selection if the selected file was deleted
  useEffect(() => {
    if (data && selectedKey && !data.some((f) => f.Key === selectedKey)) {
      setSelectedKey(null);
    }
  }, [data, selectedKey]);

  if (isLoading || !data) {
    return (
      <PageLayout>
        <LoadingPage />
      </PageLayout>
    );
  }

  const filteredFiles = data.filter((f) =>
    (f.Key ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <PageLayout>
      <div className="flex h-full flex-col overflow-hidden lg:flex-row">
        {/* ---- Left sidebar: file list ---- */}
        <div className="flex w-full flex-col border-b border-base-200 lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r xl:w-96">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
            <h1 className="text-lg font-bold">Files</h1>
            <div className="flex gap-1">
              <span className="badge badge-sm">{data.length}</span>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className={`btn btn-sm ${showUpload ? "btn-ghost" : "btn-primary"}`}
              >
                {showUpload ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                )}
                Upload
              </button>
            </div>
          </div>

          {/* Upload zone (collapsible) */}
          {showUpload && (
            <div className="border-b border-base-200 p-3">
              <Dropzone onUploadComplete={() => setShowUpload(false)} />
            </div>
          )}

          {/* Search */}
          <div className="px-3 py-2">
            <label className="input input-bordered input-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-50">
                <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className="grow"
                placeholder="Search files..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {filter && (
                <button onClick={() => setFilter("")} className="btn btn-circle btn-ghost btn-xs">
                  ✕
                </button>
              )}
            </label>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <NoData />
                <p className="mt-4 text-sm font-medium text-base-content/60">
                  {filter ? "No matching files" : "No files yet"}
                </p>
                {!filter && !showUpload && (
                  <button
                    className="btn btn-primary btn-sm mt-3"
                    onClick={() => setShowUpload(true)}
                  >
                    Upload your first file
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFiles.map((f) => (
                  <FileRow
                    key={f.ETag}
                    fileKey={f.Key ?? ""}
                    size={f.Size}
                    lastModified={f.LastModified}
                    isSelected={selectedKey === f.Key}
                    onSelect={() =>
                      setSelectedKey(selectedKey === f.Key ? null : (f.Key ?? null))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---- Right panel: file preview ---- */}
        <div className="hidden flex-1 overflow-hidden bg-base-100 lg:flex lg:flex-col">
          {selectedKey ? (
            <FilePreview key={selectedKey} fileKey={selectedKey} />
          ) : (
            <EmptyPreview />
          )}
        </div>

        {/* Mobile preview: shown below the list when a file is selected */}
        {selectedKey && (
          <div className="flex h-96 flex-col border-t border-base-200 lg:hidden">
            <FilePreview key={selectedKey} fileKey={selectedKey} />
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default isAuth(FilesPage, "admin");
