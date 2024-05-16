import { UserProfile } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="flex h-full w-full justify-center">
      <button
        onClick={() => {
          router.back();
        }}
        className="btn btn-outline m-2"
      >
        Back to Guard Shack
      </button>
      <UserProfile />
    </div>
  );
}
