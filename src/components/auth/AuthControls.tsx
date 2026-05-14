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
    return <span className="text-sm text-[#718ebf]">Checking session...</span>;
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="max-w-48 truncate text-[#343c6a]">
          {session.user?.email}
        </span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-full border border-[#dfeaf2] bg-white px-4 py-2 font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
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
        className="rounded-full border border-[#dfeaf2] bg-white px-4 py-2 font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-[#1814f3] px-4 py-2 font-medium text-white transition-colors hover:bg-[#2d60ff]"
      >
        Sign up
      </Link>
    </div>
  );
}
