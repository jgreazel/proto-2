import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  useState,
  useEffect,
  useCallback,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import Link from "next/link";
import { api } from "~/utils/api";
import handleApiError from "~/helpers/handleApiError";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

type LayoutProps = {
  actionRow?: ReactNode;
  hideHeader?: boolean;
  disabled?: boolean;
};

const Feedback = ({ onClose }: { onClose: () => void }) => {
  const { mutate, isLoading } = api.profile.leaveFeedback.useMutation({
    onError: handleApiError,
    onSuccess: () => {
      toast.success("Feedback recorded!");
      setVal("");
      onClose();
    },
  });

  const [val, setVal] = useState("");

  return (
    <dialog className="modal modal-open">
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
      <div className="modal-box flex flex-col gap-3">
        <form method="dialog">
          <button
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
          >
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </form>
        <div className="text-lg font-semibold">We&apos;d love to hear from you!</div>
        <p className="text-sm text-base-content/70">
          Got a cool idea? Spotted something wonky? Your feedback helps us make
          Guard Shack better for everyone — no thought is too small!
        </p>
        <textarea
          disabled={isLoading}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="textarea textarea-bordered w-full"
          placeholder="What's on your mind?"
          rows={4}
        ></textarea>
        <div className="flex justify-end">
          <button
            disabled={isLoading || !val.trim()}
            onClick={() => {
              mutate({ message: val });
            }}
            className="btn btn-primary"
          >
            Send Feedback
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
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </dialog>
  );
};

export const LinkListItems = ({
  isAdmin,
}: {
  isAdmin?: boolean;
}) => {
  return (
    <>
      <li>
        <Link href="/register">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
          Register
          <kbd className="kbd kbd-xs ml-auto opacity-30">G R</kbd>
        </Link>
      </li>
      <li>
        <Link href="/timeclock">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          Time Clock
          <kbd className="kbd kbd-xs ml-auto opacity-30">G T</kbd>
        </Link>
      </li>
      <li>
        <Link href="/passes">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
          Passes
          <kbd className="kbd kbd-xs ml-auto opacity-30">G P</kbd>
        </Link>
      </li>
      {isAdmin && (
        <>
          <div className="divider mb-1 mt-1"></div>
          <div className="flex items-center gap-1.5 px-3 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-primary">
              <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Admin Tools
            </span>
          </div>
          <li>
            <Link href="/items">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              Items
              <kbd className="kbd kbd-xs ml-auto opacity-30">G I</kbd>
            </Link>
          </li>
          <li>
            <Link href="/files">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
              Files
              <kbd className="kbd kbd-xs ml-auto opacity-30">G F</kbd>
            </Link>
          </li>
          <li>
            <Link href="/reports">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
              Reports
              <kbd className="kbd kbd-xs ml-auto opacity-30">G E</kbd>
            </Link>
          </li>
          <li>
            <Link href="/users">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
              Manage Users
              <kbd className="kbd kbd-xs ml-auto opacity-30">G U</kbd>
            </Link>
          </li>
          <li>
            <Link href="/timeclock/admin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                />
              </svg>
              Time Clock Admin
              <kbd className="kbd kbd-xs ml-auto opacity-30">G C</kbd>
            </Link>
          </li>
        </>
      )}
    </>
  );
};

const EndMenu = ({
  username,
  isAdmin,
}: {
  username: string;
  isAdmin: boolean;
}) => {
  const initial = username.charAt(0).toUpperCase();

  return (
    <>
      <div className="dropdown dropdown-end z-50">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost gap-2 px-2 capitalize"
        >
          {/* Avatar circle with initial */}
          <div className="relative">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${isAdmin ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"}`}>
              {initial}
            </div>
            {isAdmin && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warning text-warning-content ring-2 ring-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-2 w-2">
                  <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {/* Name + role on desktop */}
          <div className="hidden flex-col items-start sm:flex">
            <span className="text-sm font-semibold leading-tight">{username}</span>
            <span className={`text-[10px] leading-tight ${isAdmin ? "font-medium text-primary" : "text-base-content/50"}`}>
              {isAdmin ? "Admin" : "Staff"}
            </span>
          </div>
          {/* Chevron */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-base-content/40">
            <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
        <ul
          tabIndex={0}
          className="menu dropdown-content menu-md mt-2 w-60 rounded-xl bg-base-100 p-2 shadow-xl ring-1 ring-base-content/5"
        >
          {/* Profile header */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${isAdmin ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"}`}>
              {initial}
            </div>
            <div>
              <div className="font-semibold capitalize">{username}</div>
              <div className={`text-xs ${isAdmin ? "font-medium text-primary" : "text-base-content/50"}`}>
                {isAdmin ? "Administrator" : "Staff Member"}
              </div>
            </div>
          </div>
          <div className="divider m-0"></div>
          <li>
            <Link href="/users/profile">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              My Profile
            </Link>
          </li>
          {isAdmin && (
            <>
              <div className="divider mb-1 mt-1"></div>
              <div className="flex items-center gap-1.5 px-3 py-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-primary">
                  <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Admin Tools
                </span>
              </div>
              <li>
                <Link href="/items">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  Items
                  <kbd className="kbd kbd-xs ml-auto opacity-30">G I</kbd>
                </Link>
              </li>
              <li>
                <Link href="/files">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                  Files
                  <kbd className="kbd kbd-xs ml-auto opacity-30">G F</kbd>
                </Link>
              </li>
              <li>
                <Link href="/reports">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Reports
                  <kbd className="kbd kbd-xs ml-auto opacity-30">G E</kbd>
                </Link>
              </li>
              <li>
                <Link href="/users">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                  Manage Users
                  <kbd className="kbd kbd-xs ml-auto opacity-30">G U</kbd>
                </Link>
              </li>
            </>
          )}
          <div className="divider m-0"></div>
          <li className="text-error/70">
            <SignOutButton />
          </li>
        </ul>
      </div>
    </>
  );
};

const DesktopNavLink = ({
  href,
  label,
  shortcutKey,
  currentPath,
}: {
  href: string;
  label: string;
  shortcutKey?: string;
  currentPath: string;
}) => {
  const isActive =
    currentPath === href || currentPath.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`btn btn-ghost btn-sm ${isActive ? "bg-primary/15 font-semibold text-primary" : "text-base-content hover:bg-primary/10"}`}
    >
      {label}
      {shortcutKey && (
        <kbd className="kbd kbd-xs ml-0.5 hidden opacity-40 lg:inline">
          {shortcutKey}
        </kbd>
      )}
    </Link>
  );
};

/** Floating indicator shown while "G" leader key is active */
const GoToIndicator = ({
  isAdmin,
  onClose,
}: {
  isAdmin: boolean;
  onClose: () => void;
}) => (
  <div className="fixed inset-x-0 top-16 z-[100] flex animate-fade-in justify-center">
    <div className="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 shadow-xl">
      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
        Go to…
      </span>
      <div className="flex flex-wrap gap-2">
        {[
          { key: "R", label: "Register" },
          { key: "T", label: "Time Clock" },
          { key: "P", label: "Passes" },
          ...(isAdmin
            ? [
                { key: "I", label: "Items" },
                { key: "F", label: "Files" },
                { key: "E", label: "Reports" },
                { key: "U", label: "Users" },
                { key: "C", label: "TC Admin" },
              ]
            : []),
          { key: "H", label: "Home" },
        ].map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1 text-sm">
            <kbd className="kbd kbd-sm font-mono">{key}</kbd>
            <span className="text-base-content/70">{label}</span>
          </span>
        ))}
      </div>
      <button
        onClick={onClose}
        className="btn btn-circle btn-ghost btn-xs ml-1 text-base-content/40"
      >
        ✕
      </button>
    </div>
  </div>
);

const FullNav = ({ disabled }: { disabled: boolean }) => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { data: userSettings, isLoading } =
    api.profile.getSettingsByUser.useQuery(undefined, {
      enabled: isSignedIn,
    });
  const router = useRouter();
  const [showFeedback, setShowFeedback] = useState(false);
  const [goToActive, setGoToActive] = useState(false);

  const isAdmin = userSettings?.isAdmin ?? false;

  // "G" leader key: press G, then a letter to navigate
  const handleGoTo = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (isInput || disabled) return;

      if (!goToActive) {
        if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          setGoToActive(true);
        }
        return;
      }

      // Leader is active — consume the next key
      e.preventDefault();
      setGoToActive(false);

      const routes: Record<string, string> = {
        r: "/register",
        t: "/timeclock",
        p: "/passes",
        h: "/",
        ...(isAdmin
          ? { i: "/items", f: "/files", e: "/reports", u: "/users", c: "/timeclock/admin" }
          : {}),
      };

      const dest = routes[e.key.toLowerCase()];
      if (dest) void router.push(dest);
    },
    [goToActive, isAdmin, disabled, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGoTo);
    return () => window.removeEventListener("keydown", handleGoTo);
  }, [handleGoTo]);

  // Auto-dismiss leader indicator after 2 seconds
  useEffect(() => {
    if (!goToActive) return;
    const t = setTimeout(() => setGoToActive(false), 2000);
    return () => clearTimeout(t);
  }, [goToActive]);

  // user should load fast, just return empty until then
  if (!userLoaded) return <div></div>;

  const home = (
    <Link href="/" className="flex h-full items-center gap-2 px-2">
      <img src="/LOGO.png" alt="Guard Shack" className="h-full max-h-12 w-auto object-contain py-1" />
      <span className="hidden text-xl font-bold text-base-content sm:inline">Guard Shack</span>
    </Link>
  );

  return (
    <>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          {/* Mobile hamburger — hidden on md+ */}
          {!disabled && (
            <div className="dropdown z-50 md:hidden">
              <div tabIndex={0} role="button" className="btn btn-ghost text-base-content">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h8m-8 6h16"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content menu-md z-[1] mt-2 w-60 rounded-xl bg-base-100 p-2 shadow-xl ring-1 ring-base-content/5"
              >
                {isLoading ? (
                  <li className="p-2">Loading...</li>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                      <span className="text-sm font-semibold">Navigation</span>
                    </div>
                    <div className="divider m-0"></div>
                    <LinkListItems isAdmin={isAdmin} />
                  </>
                )}
              </ul>
            </div>
          )}

          {home}
        </div>

        {/* Desktop inline nav — hidden on mobile */}
        {!disabled && isSignedIn && (
          <div className="navbar-center hidden md:flex">
            <div className="flex items-center gap-1">
              <DesktopNavLink href="/register" label="Register" shortcutKey="R" currentPath={router.pathname} />
              <DesktopNavLink href="/timeclock" label="Time Clock" shortcutKey="T" currentPath={router.pathname} />
              <DesktopNavLink href="/passes" label="Passes" shortcutKey="P" currentPath={router.pathname} />
            </div>
          </div>
        )}

        <div className="navbar-end">
          {!!isSignedIn && !disabled && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFeedback(true)}
                className="btn btn-ghost btn-sm gap-1.5 text-base-content/60 hover:text-primary"
                title="Share your thoughts!"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                </svg>
                <span className="hidden sm:inline">Feedback</span>
              </button>
              <EndMenu username={user.username!} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>
      {showFeedback && <Feedback onClose={() => setShowFeedback(false)} />}
      {goToActive && (
        <GoToIndicator
          isAdmin={isAdmin}
          onClose={() => setGoToActive(false)}
        />
      )}
    </>
  );
};

export const PageLayout = (props: PropsWithChildren & LayoutProps) => {
  return (
    <main className="flex h-screen w-full flex-col justify-start">
      {!props.hideHeader && <FullNav disabled={props.disabled ?? false} />}
      {props.actionRow && <div className="p-2">{props.actionRow}</div>}
      <div className="grow overflow-auto bg-base-200">{props.children}</div>
    </main>
  );
};
