import { SignOutButton, useUser } from "@clerk/nextjs";
import type { PropsWithChildren, ReactNode } from "react";
import { Button } from "./button";

type LayoutProps = {
  actionRow?: ReactNode;
  hideHeader?: boolean;
};

export const PageLayout = (props: PropsWithChildren & LayoutProps) => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  // user should load fast, just return empty until then
  if (!userLoaded) return <div></div>;

  return (
    <main className="mx-auto flex h-screen w-full flex-col justify-start md:max-w-3xl">
      {!props.hideHeader && (
        <>
          <div className="p-4">
            {!!isSignedIn && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between font-semibold">
                  <div className="capitalize">Hi, {user.username}</div>
                  <SignOutButton />
                </div>
              </div>
            )}
            <div className="flex flex-row gap-3 pt-2">
              <Button href="/">Home</Button>
              <Button href="items">Items</Button>
              <Button href="passes">Passes</Button>
              <Button href="checkout">Checkout</Button>
              <Button href="reports">Reports</Button>
            </div>
          </div>
        </>
      )}
      <div className="grow overflow-auto">{props.children}</div>
      {props.actionRow && <div className="p-4">{props.actionRow}</div>}
    </main>
  );
};
