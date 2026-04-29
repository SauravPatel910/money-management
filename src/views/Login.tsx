"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

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
    <main className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-primary-800">Sign in</h2>
      <p className="mt-1 text-sm text-gray-600">
        Access your private accounts and transactions.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-primary-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-primary-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-200"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="mt-3 w-full rounded-lg border border-primary-200 bg-white px-6 py-3 text-sm font-medium text-primary-700 shadow-sm transition-all duration-200 hover:bg-primary-50"
      >
        Continue with Google
      </button>

      <p className="mt-5 text-center text-sm text-gray-600">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary-700 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
