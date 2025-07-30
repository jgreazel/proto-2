import { type ReactElement, useState } from "react";
import { Button, Table, Card, Space, Typography, Tag } from "antd";
import dayjs from "dayjs";
import { PageLayout } from "~/components/layout";
import { api, type RouterOutputs } from "~/utils/api";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import handleApiError from "~/helpers/handleApiError";
import isAuth from "~/components/isAuth";
import { UndoOutlined, EyeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

type CompletedSale = NonNullable<
  RouterOutputs["items"]["getCompletedSales"]
>[0];

export default function SalesHistory() {
  const [hoursBack, setHoursBack] = useState(24);

  const {
    data: completedSales,
    isLoading,
    refetch,
  } = api.items.getCompletedSales.useQuery(
    { hoursBack },
    {
      onError: handleApiError,
    },
  );

  const handleHoursBackChange = (hours: number) => {
    setHoursBack(hours);
    void refetch();
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Text code className="text-xs">
          {id.slice(-8)}
        </Text>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => (
        <div>
          <div>{dayjs(date).format("MMM DD, YYYY")}</div>
          <Text type="secondary" className="text-xs">
            {dayjs(date).format("h:mm A")}
          </Text>
        </div>
      ),
    },
    {
      title: "Items",
      dataIndex: "itemCount",
      key: "itemCount",
      render: (count: number, record: CompletedSale) => (
        <div>
          <div>
            {count} item{count !== 1 ? "s" : ""}
          </div>
          <Text type="secondary" className="text-xs">
            {record.items
              .map((item) => `${item.amountSold}x ${item.label}`)
              .join(", ")}
          </Text>
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => (
        <Text strong className="text-green-600">
          {dbUnitToDollars(total)}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: () => <Tag color="green">Completed</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, _record: CompletedSale) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            View
          </Button>
          <Button type="link" danger icon={<UndoOutlined />} size="small">
            Void
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Title level={2}>Sales History</Title>
          <Text type="secondary">
            View and manage completed concession sales
          </Text>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Time Window: </Text>
              <Space>
                <Button
                  type={hoursBack === 1 ? "primary" : "default"}
                  size="small"
                  onClick={() => handleHoursBackChange(1)}
                >
                  1 Hour
                </Button>
                <Button
                  type={hoursBack === 8 ? "primary" : "default"}
                  size="small"
                  onClick={() => handleHoursBackChange(8)}
                >
                  8 Hours
                </Button>
                <Button
                  type={hoursBack === 24 ? "primary" : "default"}
                  size="small"
                  onClick={() => handleHoursBackChange(24)}
                >
                  24 Hours
                </Button>
                <Button
                  type={hoursBack === 72 ? "primary" : "default"}
                  size="small"
                  onClick={() => handleHoursBackChange(72)}
                >
                  3 Days
                </Button>
                <Button
                  type={hoursBack === 168 ? "primary" : "default"}
                  size="small"
                  onClick={() => handleHoursBackChange(168)}
                >
                  7 Days
                </Button>
              </Space>
            </div>
            <div>
              <Text type="secondary">
                Showing sales from last {hoursBack} hour
                {hoursBack !== 1 ? "s" : ""}
              </Text>
            </div>
          </div>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={completedSales ?? []}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} sales`,
            }}
          />
        </Card>
      </div>
    </PageLayout>
  );
}

SalesHistory.getLayout = function getLayout(page: ReactElement) {
  return isAuth(page);
};
