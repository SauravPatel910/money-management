"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAppDispatch } from "@/config/reduxStore";
import { clearMoneyData } from "@/store/transactionsSlice";

export default function AuthControls() {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      dispatch(clearMoneyData());
    }
  }, [dispatch, status]);

  if (status === "loading") {
    return <span className="text-sm text-primary-700">Checking session...</span>;
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="max-w-48 truncate text-primary-800">
          {session.user?.email}
        </span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border border-primary-300 bg-white px-4 py-2 font-medium text-primary-700 shadow-sm transition-all duration-200 hover:bg-primary-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <Link
        href="/login"
        className="rounded-lg border border-primary-300 bg-white px-4 py-2 font-medium text-primary-700 shadow-sm transition-all duration-200 hover:bg-primary-50"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-4 py-2 font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      >
        Sign up
      </Link>
    </div>
  );
}
