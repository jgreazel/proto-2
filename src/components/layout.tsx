import { SignOutButton, useUser } from "@clerk/nextjs";
import { useState, type PropsWithChildren, type ReactNode } from "react";
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
  DollarOutlined,
  EditOutlined,
  FileOutlined,
  HomeOutlined,
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

// sales:
// - concession, admission (buy, admit)
// -- sales desk, items, new, restock (for concession)

// todo trim by permissions
const items: MenuItem[] = [
  getItem(<LinkWithQP href={"/"}>Home</LinkWithQP>, "", <HomeOutlined />),
  getItem("Sales", "sales", <DollarOutlined />, [
    getItem("Concessions", "concessions", "", [
      getItem(
        <LinkWithQP href={"/sales/concessions/sales-desk"}>
          Sales Desk
        </LinkWithQP>,
        "concessions-sales-desk",
        <ShoppingCartOutlined />,
      ),
      getItem(
        <LinkWithQP href={"/sales/concessions/items"}>Items</LinkWithQP>,
        "concessions-items",
        <UnorderedListOutlined />,
      ),
      getItem(
        <LinkWithQP href="/sales/concessions/0">New</LinkWithQP>,
        "concessions-new",
        <PlusOutlined />,
      ),
      getItem(
        <LinkWithQP href="/items/restock">Restock</LinkWithQP>,
        "restock",
        <TruckOutlined />,
      ),
    ]),

    getItem("Admissions", "admissions", "", [
      getItem(
        <LinkWithQP href={"/sales/admissions/sales-desk"}>
          Sales Desk
        </LinkWithQP>,
        "admissions-sales-desk",
        <ShoppingCartOutlined />,
      ),
      getItem(
        <LinkWithQP href={"/sales/admissions/items"}>Items</LinkWithQP>,
        "admissions-items",
        <UnorderedListOutlined />,
      ),
      getItem(
        <LinkWithQP href="/sales/admissions/0">New</LinkWithQP>,
        "admissions-new",
        <PlusOutlined />,
      ),
    ]),
    // todo replace
    // getItem(
    //   <LinkWithQP href={"/checkout"}>Sales Desk</LinkWithQP>,
    //   "checkout",
    //   <ShoppingCartOutlined />,
    // ),
    // getItem(
    //   <LinkWithQP href="/items">Items</LinkWithQP>,
    //   "items",
    //   <UnorderedListOutlined />,
    //   [
    //     getItem(
    //       <LinkWithQP href="/items/0">New</LinkWithQP>,
    //       "new-item",
    //       <PlusOutlined />,
    //     ),
    //     getItem(
    //       <LinkWithQP href="/items/restock">Restock</LinkWithQP>,
    //       "restock",
    //       <TruckOutlined />,
    //     ),
    //   ],
    // ),
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
  getItem(
    <LinkWithQP href="/schedules">Schedules</LinkWithQP>,
    "schedules",
    <CalendarOutlined />,
  ),
  getItem(
    <LinkWithQP href="/timeclock">Time Clock</LinkWithQP>,
    "timeclock",
    <ClockCircleOutlined />,
  ),
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
      <LinkWithQP href="/timeclock/admin">Alter Time Clock</LinkWithQP>,
      "timeclock-admin",
      <ClockCircleOutlined />,
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
    case "checkout":
      return "Sales Desk";
    case "passes":
      return "Season Passes";
    case "timeclock":
      return "Time Clock";
    case "items":
      return "Inventory";
    case "[id]":
      return <EditOutlined />;
    default:
      return <div className="capitalize">{val}</div>;
  }
};

const SideNavLayout = (props: PropsWithChildren) => {
  const sp = useSearchParams();
  const menu = sp.get("menu");
  const [collapsed, setCollapsed] = useState(menu === "min");
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
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    if (localStorage.getItem("gs-side-nav-open-keys")) {
      const storedKeys = localStorage.getItem("gs-side-nav-open-keys");
      return storedKeys ? (JSON.parse(storedKeys) as string[]) : [];
    }
    return [];
  });

  const onOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
    localStorage.setItem("gs-side-nav-open-keys", JSON.stringify(keys));
  };
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => {
          void router.push({
            pathname: router.pathname,
            query: { ...router.query, menu: value ? "min" : "max" },
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
