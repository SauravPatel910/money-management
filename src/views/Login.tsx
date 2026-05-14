"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import StatusMessage from "../components/UI/StatusMessage";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md rounded-[25px] bg-white p-8">
      <h2 className="text-[28px] font-semibold text-[#343c6a]">Sign in</h2>
      <p className="mt-2 text-sm text-[#718ebf]">
        Access your private accounts and transactions.
      </p>

      {error && (
        <StatusMessage className="mt-4" tone="error">
          {error}
        </StatusMessage>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#343c6a]">
            Email
            <span className="ml-1 text-[#ff4b4a]">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors focus:border-[#2d60ff]"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#343c6a]">
            Password
            <span className="ml-1 text-[#ff4b4a]">*</span>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors focus:border-[#2d60ff]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[50px] w-full rounded-[15px] bg-[#1814f3] px-6 text-sm font-medium text-white transition-colors hover:bg-[#2d60ff] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-200"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="mt-3 h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-6 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
      >
        Continue with Google
      </button>

      <p className="mt-5 text-center text-sm text-[#718ebf]">
        New here?{" "}
        <Link href="/signup" className="font-medium text-[#1814f3] underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
