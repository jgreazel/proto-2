import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { InputNumber } from "antd";
import moneyMask from "~/helpers/moneyMask";
import { api } from "~/utils/api";
import handleApiError from "~/helpers/handleApiError";
import toast from "react-hot-toast";
import type { RouterOutputs } from "~/utils/api";

type ItemWithCreatedBy = RouterOutputs["items"]["getAll"][number];

type ConcessionFormData = {
  label: string;
  purchasePrice: number;
  sellingPrice: number;
  inStock: number;
  changeNote?: string;
};

type AdmissionFormData = {
  label: string;
  sellingPrice: number;
  patronLimit?: number;
  changeNote?: string;
};

interface InlineItemEditProps {
  item: ItemWithCreatedBy;
  onSave: () => void;
  onCancel: () => void;
}

export const InlineItemEdit = ({
  item,
  onSave,
  onCancel,
}: InlineItemEditProps) => {
  const ctx = api.useUtils();

  const { mutate: updateConcession, isLoading: isUpdatingConcession } =
    api.items.updateConcessionItem.useMutation({
      onSuccess: () => {
        toast.success("Item updated!");
        void ctx.items.getAll.invalidate();
        onSave();
      },
      onError: handleApiError,
    });

  const { mutate: updateAdmission, isLoading: isUpdatingAdmission } =
    api.items.updateAdmissionItem.useMutation({
      onSuccess: () => {
        toast.success("Item updated!");
        void ctx.items.getAll.invalidate();
        onSave();
      },
      onError: handleApiError,
    });

  const { mutate: deleteItem, isLoading: isDeleting } =
    api.items.deleteConcessionItem.useMutation({
      onSuccess: () => {
        toast.success("Item deleted!");
        void ctx.items.getAll.invalidate();
        onSave();
      },
      onError: handleApiError,
    });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isLoading = isUpdatingConcession || isUpdatingAdmission || isDeleting;

  if (item.item.isConcessionItem) {
    return (
      <ConcessionItemEdit
        item={item}
        onSave={(data) => updateConcession({ ...data, id: item.item.id })}
        onCancel={onCancel}
        onDelete={() => deleteItem({ id: item.item.id })}
        isLoading={isLoading}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />
    );
  } else {
    return (
      <AdmissionItemEdit
        item={item}
        onSave={(data) => updateAdmission({ ...data, id: item.item.id })}
        onCancel={onCancel}
        isLoading={isLoading}
      />
    );
  }
};

const ConcessionItemEdit = ({
  item,
  onSave,
  onCancel,
  onDelete,
  isLoading,
  showDeleteConfirm,
  setShowDeleteConfirm,
}: {
  item: ItemWithCreatedBy;
  onSave: (data: ConcessionFormData) => void;
  onCancel: () => void;
  onDelete: () => void;
  isLoading: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
}) => {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [pendingData, setPendingData] = useState<ConcessionFormData | null>(
    null,
  );

  const { register, handleSubmit, control, formState, setValue } =
    useForm<ConcessionFormData>({
      defaultValues: {
        label: item.item.label,
        purchasePrice: item.item.purchasePrice ?? 0,
        sellingPrice: item.item.sellingPrice,
        inStock: item.item.inStock ?? 0,
        changeNote: "",
      },
    });

  const handleSaveClick = (data: ConcessionFormData) => {
    setPendingData(data);
    setShowNoteDialog(true);
  };

  const handleFinalSave = () => {
    if (pendingData) {
      onSave(pendingData);
      setShowNoteDialog(false);
      setPendingData(null);
    }
  };

  const handleNoteCancel = () => {
    setShowNoteDialog(false);
    setPendingData(null);
  };

  return (
    <>
      <td>
        <input
          {...register("label", { required: true })}
          className="input input-sm input-bordered w-full"
          disabled={isLoading}
        />
      </td>
      <td>
        <div className="badge badge-outline">Concession</div>
      </td>
      <td>
        <Controller
          control={control}
          name="purchasePrice"
          render={({ field }) => (
            <InputNumber
              {...moneyMask}
              size="small"
              className="w-full"
              disabled={isLoading}
              value={field.value}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </td>
      <td>
        <Controller
          control={control}
          name="sellingPrice"
          render={({ field }) => (
            <InputNumber
              {...moneyMask}
              size="small"
              className="w-full"
              disabled={isLoading}
              value={field.value}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </td>
      <td>
        <Controller
          control={control}
          name="inStock"
          render={({ field }) => (
            <InputNumber
              size="small"
              className="w-full"
              disabled={isLoading}
              min={0}
              value={field.value}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </td>
      <td>
        <div className="flex gap-1">
          <button
            onClick={handleSubmit(handleSaveClick)}
            className="btn btn-circle btn-ghost btn-sm"
            disabled={isLoading || !formState.isValid}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </button>
          <button
            onClick={onCancel}
            className="btn btn-circle btn-ghost btn-sm"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-circle btn-ghost btn-sm text-error"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      </td>
      {showDeleteConfirm && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Delete Item?</h3>
            <p className="py-4">This action cannot be undone.</p>
            <div className="modal-action">
              <button
                onClick={onDelete}
                className="btn btn-error"
                disabled={isLoading}
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      )}
      {showNoteDialog && pendingData && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Add Change Note</h3>
            <p className="py-2 text-sm text-gray-600">
              Please provide a note describing this change for accountability:
            </p>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Describe what changed and why..."
              value={pendingData.changeNote ?? ""}
              onChange={(e) =>
                setPendingData({ ...pendingData, changeNote: e.target.value })
              }
              rows={3}
            />
            <div className="modal-action">
              <button
                onClick={handleFinalSave}
                className="btn btn-primary"
                disabled={isLoading}
              >
                Save Changes
              </button>
              <button onClick={handleNoteCancel} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

const AdmissionItemEdit = ({
  item,
  onSave,
  onCancel,
  isLoading,
}: {
  item: ItemWithCreatedBy;
  onSave: (data: AdmissionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [pendingData, setPendingData] = useState<AdmissionFormData | null>(
    null,
  );

  const { register, handleSubmit, control, formState } =
    useForm<AdmissionFormData>({
      defaultValues: {
        label: item.item.label,
        sellingPrice: item.item.sellingPrice,
        patronLimit: item.item.patronLimit ?? undefined,
        changeNote: "",
      },
    });

  const handleSaveClick = (data: AdmissionFormData) => {
    setPendingData(data);
    setShowNoteDialog(true);
  };

  const handleFinalSave = () => {
    if (pendingData) {
      onSave(pendingData);
      setShowNoteDialog(false);
      setPendingData(null);
    }
  };

  const handleNoteCancel = () => {
    setShowNoteDialog(false);
    setPendingData(null);
  };

  return (
    <>
      <td>
        <input
          {...register("label", { required: true })}
          className="input input-sm input-bordered w-full"
          disabled={isLoading}
        />
      </td>
      <td>
        <div className="badge badge-outline">Admission</div>
      </td>
      <td>N/A</td>
      <td>
        <Controller
          control={control}
          name="sellingPrice"
          render={({ field }) => (
            <InputNumber
              {...moneyMask}
              size="small"
              className="w-full"
              disabled={isLoading}
              value={field.value}
              onChange={(v) => field.onChange(v)}
            />
          )}
        />
      </td>
      <td>
        {item.item.isDay ? (
          <div className="badge badge-secondary badge-outline">Day</div>
        ) : (
          <div className="badge badge-accent badge-outline">Seasonal</div>
        )}
      </td>
      <td>
        <div className="flex gap-1">
          <button
            onClick={handleSubmit(handleSaveClick)}
            className="btn btn-circle btn-ghost btn-sm"
            disabled={isLoading || !formState.isValid}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </button>
          <button
            onClick={onCancel}
            className="btn btn-circle btn-ghost btn-sm"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </td>
      {showNoteDialog && pendingData && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Add Change Note</h3>
            <p className="py-2 text-sm text-gray-600">
              Please provide a note describing this change for accountability:
            </p>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Describe what changed and why..."
              value={pendingData.changeNote ?? ""}
              onChange={(e) =>
                setPendingData({ ...pendingData, changeNote: e.target.value })
              }
              rows={3}
            />
            <div className="modal-action">
              <button
                onClick={handleFinalSave}
                className="btn btn-primary"
                disabled={isLoading}
              >
                Save Changes
              </button>
              <button onClick={handleNoteCancel} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};
