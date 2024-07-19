import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import Link from "next/link";
import { api } from "~/utils/api";
import handleApiError from "~/helpers/handleApiError";
import toast from "react-hot-toast";
import { LoadingSpinner } from "./loading";
import { useRouter } from "next/router";
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ContactsOutlined,
  DatabaseOutlined,
  DollarOutlined,
  EditOutlined,
  FileDoneOutlined,
  FileExclamationOutlined,
  FileOutlined,
  HomeOutlined,
  InboxOutlined,
  IssuesCloseOutlined,
  MessageOutlined,
  PlusOutlined,
  PoweroffOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  UnorderedListOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Breadcrumb, Layout, Menu, theme } from "antd";
import { useSearchParams } from "next/navigation";
import { LinkWithQP } from "./LinkWithQP";

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

// Items will eventually have configurable types, sales & inventory pages will have tabs for each
// eventually move admission to passes list (if i make passes configurable: as a salesman i want to create new passes automatically)
// todo trim by permissions
const items: MenuItem[] = [
  getItem(<LinkWithQP href={"/"}>Home</LinkWithQP>, "", <HomeOutlined />),
  getItem(
    <LinkWithQP href={"/sales-desk"}>Sales Desk</LinkWithQP>,
    "sales-desk",
    <DollarOutlined />,
  ),
  getItem("Inventory", "inventory", <InboxOutlined />, [
    getItem(
      <LinkWithQP href={"/inventory"}>List</LinkWithQP>,
      "inventory-list",
      <UnorderedListOutlined />,
    ),
    getItem(
      <LinkWithQP href="/inventory/0">New</LinkWithQP>,
      "new-item",
      <PlusOutlined />,
    ),
    getItem(
      <LinkWithQP href={"/inventory/restock"}>Restock</LinkWithQP>,
      "restock",
      <TruckOutlined />,
    ),
  ]),
  getItem("Passes", "passes", <ContactsOutlined />, [
    getItem(
      <LinkWithQP href={"/passes"}>List</LinkWithQP>,
      "passes-list",
      <UnorderedListOutlined />,
    ),
    getItem(
      <LinkWithQP href="/passes/0">New</LinkWithQP>,
      "new-pass",
      <PlusOutlined />,
    ),
  ]),
  getItem("Time", "time", <ClockCircleOutlined />, [
    getItem(
      <LinkWithQP href="/time/schedules">Schedules</LinkWithQP>,
      "schedules",
      <CalendarOutlined />,
    ),
    getItem(
      <LinkWithQP href="/time/timeclock">Time Clock</LinkWithQP>,
      "timeclock",
      <FileDoneOutlined />,
    ),
    getItem(
      <LinkWithQP href="/time/edit-timeclock">Edit Time Clock</LinkWithQP>,
      "timeclock-admin",
      <IssuesCloseOutlined />,
    ),
  ]),
  getItem("Settings", "settings", <SettingOutlined />, [
    getItem(
      <LinkWithQP href="/files">Files</LinkWithQP>,
      "files",
      <FileOutlined />,
    ),
    getItem(
      <LinkWithQP href="/reports">Reports</LinkWithQP>,
      "reports",
      <BarChartOutlined />,
    ),
    getItem(
      <LinkWithQP href="/users">Manage Users</LinkWithQP>,
      "users",
      <UserSwitchOutlined />,
    ),

    getItem(
      <LinkWithQP href="/feedback">Leave Feedback</LinkWithQP>,
      "feedback",
      <MessageOutlined />,
    ),
    getItem(
      <SignOutButton>Sign Out</SignOutButton>,
      "sign-out",
      <PoweroffOutlined />,
    ),
  ]),
];

const getLabel = (val?: string) => {
  switch (val) {
    case "passes":
      return "Season Passes";
    case "timeclock":
      return "Time Clock";
    case "[id]":
      return <EditOutlined />;
    default:
      return <div className="capitalize">{val?.replace("-", " ")}</div>;
  }
};

const SideNavLayout = (props: PropsWithChildren) => {
  const sp = useSearchParams();
  const isCollapsedMenu = sp.get("min");
  const [collapsed, setCollapsed] = useState(isCollapsedMenu === "1");
  const {
    token: { colorBgContainer, borderRadiusLG, colorPrimary },
  } = theme.useToken();
  const router = useRouter();

  const highlightedMenuItem = router.pathname.split("/")[1];
  const bc = router.pathname
    .split("/")
    .slice(1)
    // todo add a menu for dd breadcrumbs for nested paths
    .map((x) => ({
      title: <LinkWithQP href={`/${x}`}>{getLabel(x)}</LinkWithQP>,
    }));
  bc.unshift({
    title: <LinkWithQP href={`/`}>Home</LinkWithQP>,
  });
  const { user, isSignedIn } = useUser();
  const avatarLetter = user?.username?.[0] ?? user?.firstName?.[0] ?? "";
  const openSPs = sp.getAll("open");
  const [openKeys, setOpenKeys] = useState<string[]>(
    openSPs.length > 0 ? openSPs : [],
  );

  const onOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
    if (collapsed) return;
    void router.push({
      pathname: router.pathname,
      query: { ...router.query, open: keys },
    });
  };
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={async (value) => {
          console.log("collapse ", value);
          const query = { ...router.query, min: value ? "1" : "0" };
          if ("open" in query) {
            delete query.open;
          }
          await router.push({
            pathname: router.pathname,
            query,
          });
          setCollapsed(value);
        }}
      >
        <Menu
          theme="dark"
          defaultSelectedKeys={[highlightedMenuItem ?? "home"]}
          mode="inline"
          items={items}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "1rem",
            background: colorBgContainer,
            alignContent: "center",
            justifyContent: "space-between",
            display: "flex",
          }}
        >
          {/* // todo maybe put logo here */}
          <h1
            style={{ color: colorPrimary }}
            className="text-2xl font-semibold"
          >
            Guard Shack
          </h1>
          {isSignedIn && (
            <Avatar style={{ background: colorPrimary }} className="capitalize">
              {avatarLetter}
            </Avatar>
          )}
        </Header>
        <Content style={{ margin: "0 16px" }}>
          <div className="flex flex-row items-center gap-2">
            <ArrowLeftOutlined
              onClick={() => router.back()}
              className="btn btn-circle btn-sm"
            />
            <Breadcrumb style={{ margin: "16px 0" }} items={bc}></Breadcrumb>
          </div>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {props.children}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Guard Shack ©{new Date().getFullYear()} Created by J Greazel
        </Footer>
      </Layout>
    </Layout>
  );
};

export const PageLayout = (props: PropsWithChildren) => {
  return <SideNavLayout>{props.children}</SideNavLayout>;
};
