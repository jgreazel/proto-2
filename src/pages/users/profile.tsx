import { UserProfile, useUser } from "@clerk/nextjs";
import { PageLayout } from "~/components/layout";

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <PageLayout>
      {/* Header banner */}
      <div className="bg-gradient-to-r from-secondary to-accent px-6 py-6 shadow-md">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Profile"
              className="h-14 w-14 rounded-full ring-2 ring-white/30"
            />
          ) : (
            <div className="avatar placeholder">
              <div className="h-14 w-14 rounded-full bg-white/20 text-secondary-content">
                <span className="text-xl font-bold">
                  {user?.firstName?.charAt(0) ?? user?.username?.charAt(0) ?? "?"}
                </span>
              </div>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-secondary-content">
              {user?.fullName ?? user?.username ?? "Your Profile"}
            </h1>
            <p className="text-sm text-secondary-content/70">
              Manage your account, security, and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Clerk UserProfile — centered and styled to blend in */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-base-200 rounded-xl",
              navbar: "hidden",
              pageScrollBox: "p-6",
            },
          }}
        />
      </div>
    </PageLayout>
  );
}
