import { DatePicker, Popconfirm, Select, Table, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

type GetEventsData = {
  date: Dayjs;
  userId: string;
};

type GetEventFormProps = {
  onSubmit: (data: GetEventsData) => void;
};

const GetEventsForm = (props: GetEventFormProps) => {
  const { handleSubmit, control, formState } = useForm<GetEventsData>();
  const { data, isLoading, error } = api.profile.getUsers.useQuery();

  if (isLoading) return <LoadingPage />;
  if (error)
    return <div className="badge badge-error">Error: {error.message}</div>;

  const opts = data.map((u) => ({
    value: u.id,
    label:
      !!u.firstName && !!u.lastName
        ? `${u.firstName} ${u.lastName} (${u.username})`
        : u.username,
  }));

  return (
    <div className="flex flex-col gap-2 rounded-lg p-4 shadow-lg">
      <div role="alert" className="alert">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-info"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>Select a date & team member to modify their time punches</span>
      </div>
      <form
        // className="mx-auto flex flex-col gap-2 rounded-xl p-4 shadow-lg md:w-1/2"
        className="flex flex-row items-end gap-2"
        onSubmit={handleSubmit(props.onSubmit)}
      >
        <Controller
          control={control}
          name="date"
          rules={{ required: true }}
          render={({ field }) => (
            <label className="form-control w-full max-w-md">
              <div className="label">
                <span className="label-text">Date</span>
              </div>
              <DatePicker
                value={field.value}
                format="MM/DD/YYYY"
                className="max-w-m w-full"
                onChange={(date) => field.onChange(date)}
              />
            </label>
          )}
        />
        <Controller
          control={control}
          name="userId"
          rules={{ required: true }}
          render={({ field }) => (
            <label className="form-control w-full max-w-md">
              <div className="label">
                <span className="label-text">Team Member</span>
              </div>
              <Select
                value={field.value}
                className="max-w-m w-full"
                options={opts}
                onChange={(date) => field.onChange(date)}
              />
            </label>
          )}
        />
        {/* <div className="flex justify-end"> */}
        <button className="btn btn-primary" disabled={!formState.isValid}>
          Get Punches
        </button>
        {/* </div> */}
      </form>
    </div>
  );
};

type HourCode = {
  id: string;
  label: string;
  hourlyRate: number;
  createdBy: string;
  createdAt: Date;
};

type TimeclockEvent = {
  id: string;
  userId: string;
  hourCodeId: string;
  createdBy: string;
  createdAt: Date;
  hourCode: HourCode;
};

type TableProps = {
  data: GetEventsData;
};

type RowForm = {
  hourCodeId: string;
  time: Date;
};

const EventsTable = (props: TableProps) => {
  const { data, isLoading, error } =
    api.timeclockAdmin.getTimeclockEvents.useQuery(
      {
        userId: props.data.userId,
        range: [
          props.data.date.startOf("day").toDate(),
          props.data.date.endOf("day").toDate(),
        ],
      },
      { enabled: !!props.data },
    );

  const { data: hcData, isLoading: hcIsLoading } =
    api.schedules.getHourCodes.useQuery();

  const util = api.useUtils();

  const { mutate, isLoading: isUpdating } =
    api.timeclockAdmin.upsertTimeclockEvent.useMutation({
      onError: handleApiError,
      onSuccess: () => {
        toast.success("Saved!");
        void util.timeclockAdmin.getTimeclockEvents.invalidate();
      },
    });

  const { mutate: duaDelete, isLoading: isDeleting } =
    api.timeclockAdmin.deleteTimeclockEvent.useMutation({
      onError: handleApiError,
      onSuccess: () => {
        toast.success("Deleted!");
        void util.timeclockAdmin.getTimeclockEvents.invalidate();
      },
    });

  const { control, handleSubmit, setValue, getValues } = useForm<RowForm>();
  const [editingKey, setEditingKey] = useState("");
  const [dataSource, setDataSource] = useState<TimeclockEvent[]>([]);

  const handleDelete = (id: string) => {
    duaDelete({ id });
    setEditingKey("");
  };

  useEffect(() => {
    if (data) {
      setDataSource(data);
    }
  }, [data]);

  const roleOpts = hcData?.map((x) => ({
    value: x.id,
    label: x.label,
  }));

  const isEditing = (record: TimeclockEvent) => record.id === editingKey;

  const edit = (record: TimeclockEvent) => {
    setValue("hourCodeId", record.hourCodeId);
    setValue("time", record.createdAt);
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const save = (key: string) => {
    const { hourCodeId, time } = getValues();
    const newData = [...dataSource];
    const index = newData.findIndex((item) => key === item.id);

    if (index > -1 || key === "") {
      const item = newData[index];
      newData.splice(index, 1, {
        ...item!,
        hourCodeId: hourCodeId,
        createdAt: time,
      });
      setDataSource(newData);
      setEditingKey("");
      try {
        mutate({
          hourCodeId,
          time,
          eventId: key || undefined,
          userId: key === "" ? props.data.userId : undefined,
        });
      } catch (error) {
        console.error("Failed to save:", error);
      }
    } else {
      console.error("Row not found for key:", key);
    }
  };

  const isFetching = isUpdating || isDeleting;
  const newOpen = editingKey === "";

  const columns = [
    {
      title: "Role",
      dataIndex: "hourCodeId",
      editable: true,
      render: (_: unknown, record: TimeclockEvent) => (
        <span className="capitalize">{record.hourCode.label}</span>
      ),
    },
    {
      title: "Time",
      dataIndex: "time",
      editable: true,
      render: (_: unknown, record: TimeclockEvent) => (
        <span>{record.createdAt.toLocaleTimeString()}</span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: unknown, record: TimeclockEvent) => {
        const editable = isEditing(record);
        return editable ? (
          <span className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={cancel}
              disabled={isFetching || newOpen}
            >
              Cancel
            </button>
            <Popconfirm
              title="Delete this Event?"
              onConfirm={() => handleDelete(record.id)}
              okButtonProps={{ className: "btn btn-sm btn-primary" }}
              cancelButtonProps={{ className: "btn btn-sm btn-ghost" }}
            >
              <button
                type="button"
                disabled={isFetching || newOpen}
                className="btn btn-ghost btn-sm text-red-400"
              >
                Delete
              </button>
            </Popconfirm>
            <button
              type="button"
              disabled={isFetching}
              className="btn btn-outline btn-secondary btn-sm"
              onClick={handleSubmit(() => save(record.id))}
            >
              Save
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-sm"
            disabled={!newOpen}
            onClick={() => edit(record)}
          >
            Edit
          </button>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: TimeclockEvent) => ({
        record,
        inputType: col.dataIndex === "time" ? "time" : "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        control: control,
      }),
    };
  });

  type EditableCellProps = {
    editing: boolean;
    dataIndex: keyof RowForm;
    title: string;
    inputType: "text" | "number" | "time"; // Define all possible input types
    control: Control<RowForm>;
    children: React.ReactNode;
    restProps: unknown; // Rest of the props
  };

  const EditableCell: React.FC<EditableCellProps> = ({
    editing,
    dataIndex,
    title,
    inputType,
    control,
    children,
    ...restProps
  }) => {
    return (
      <td {...restProps}>
        {editing ? (
          <Controller
            name={dataIndex}
            control={control}
            rules={{ required: `Please input ${title}!` }}
            render={({ field }) => {
              if (inputType === "time") {
                return (
                  <TimePicker
                    {...field}
                    format="h:mm A"
                    value={dayjs(field.value)}
                    onChange={(x) => field.onChange(x.toDate())}
                  />
                );
              }
              return (
                <Select
                  {...field}
                  className="w-full"
                  options={roleOpts}
                  value={field.value?.toString() ?? ""}
                  onChange={(x) => field.onChange(x)}
                ></Select>
              );
            }}
          />
        ) : (
          children
        )}
      </td>
    );
  };

  const handleAdd = () => {
    const data: TimeclockEvent = {
      userId: props.data.userId,
      hourCodeId: "",
      createdAt: new Date(),
      // default/mock values
      id: "",
      createdBy: "",
      hourCode: {
        id: "",
        label: "",
        hourlyRate: 0,
        createdBy: "",
        createdAt: new Date(),
      },
    };
    setDataSource((old) => [...old, data]);
    edit(data);
  };

  if (isLoading || hcIsLoading) return <LoadingPage />;
  if (error)
    return <div className="badge badge-error">Error: {error.message}</div>;

  return (
    <>
      <button className="btn btn-sm max-w-sm" onClick={handleAdd}>
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
        Add Punch
      </button>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={dataSource}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: cancel,
        }}
      />
    </>
  );
};

export const AdminTimeClock = () => {
  const [events, setEvents] = useState<GetEventsData>();

  const handleGetEvents = (data: GetEventsData) => {
    setEvents(data);
    // should i add data to url params?
    // would also need to grab them for form default values
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <GetEventsForm onSubmit={handleGetEvents} />
      {!!events && <EventsTable data={events} />}
    </div>
  );
};

const TimeclockAdminView = () => {
  return (
    <PageLayout>
      <AdminTimeClock />
    </PageLayout>
  );
};

export default isAuth(TimeclockAdminView, "admin");
