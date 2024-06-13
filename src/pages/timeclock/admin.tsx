import { DatePicker, Select, Table, TimePicker } from "antd";
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
  const { handleSubmit, control } = useForm<GetEventsData>();
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
    <form
      className="mx-auto flex flex-col gap-2 md:w-1/2"
      onSubmit={handleSubmit(props.onSubmit)}
    >
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <label className="form-control w-full max-w-md">
            <div className="label">
              <span className="label-text">Date</span>
            </div>
            <DatePicker
              value={field.value}
              format="MM/DD/YYYY"
              className="max-w-m input input-bordered w-full"
              onChange={(date) => field.onChange(date)}
            />
          </label>
        )}
      />
      <Controller
        control={control}
        name="userId"
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
      <div className="flex justify-end">
        <button className="btn btn-primary">Get Punches</button>
      </div>
    </form>
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

  const { mutate } = api.timeclockAdmin.updateTimeclockEvent.useMutation({
    onError: handleApiError,
    onSuccess: () => {
      toast.success("Saved!");
    },
  });

  const { control, handleSubmit, setValue, getValues } = useForm<RowForm>();
  const [editingKey, setEditingKey] = useState("");
  const [dataSource, setDataSource] = useState<TimeclockEvent[]>([]);

  useEffect(() => {
    if (data) {
      setDataSource(data);
    }
  }, [data]);

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

    if (index > -1) {
      const item = newData[index];
      newData.splice(index, 1, {
        ...item!,
        hourCodeId: hourCodeId,
        createdAt: time,
      });
      setDataSource(newData);
      setEditingKey("");
      try {
        mutate({ hourCodeId, time, eventId: key });
      } catch (error) {
        console.error("Failed to save:", error);
      }
    } else {
      console.error("Row not found for key:", key);
    }
  };

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
          <span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleSubmit(() => save(record.id))}
            >
              Save
            </button>
            <button type="button" className="btn btn-sm" onClick={cancel}>
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-sm"
            disabled={editingKey !== ""}
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
                // <Input
                //   value={field.value.toString()}
                //   type={inputType === "number" ? "number" : "text"}
                // />
                <Select
                  {...field}
                  className="w-full"
                  // todo get options list
                  value={field.value.toString()}
                >
                  {/* <Select.Option value={record.hourCodeId}>
                  {record.hourCode.label}
                </Select.Option> */}
                  {/* Add more options if needed */}
                </Select>
              );
            }}
          />
        ) : (
          children
        )}
      </td>
    );
  };

  if (isLoading) return <LoadingPage />;
  if (error)
    return <div className="badge badge-error">Error: {error.message}</div>;

  return (
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
  );
};

const TimeclockAdminView = () => {
  const [events, setEvents] = useState<GetEventsData>();

  const handleGetEvents = (data: GetEventsData) => {
    setEvents(data);
  };

  return (
    <PageLayout>
      <div className="flex flex-col gap-2 p-2">
        <GetEventsForm onSubmit={handleGetEvents} />
        {!!events && <EventsTable data={events} />}
      </div>
    </PageLayout>
  );
};

export default isAuth(TimeclockAdminView, "admin");
