"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import StatusMessage from "../components/UI/StatusMessage";

export default function Signup() {
  const router = useRouter();
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message || "Failed to create account");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      router.replace("/login");
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md rounded-[25px] bg-white p-8">
      <h2 className="text-[28px] font-semibold text-[#343c6a]">Create account</h2>
      <p className="mt-2 text-sm text-[#718ebf]">
        Your money data stays private to your login.
      </p>

      {error && (
        <StatusMessage className="mt-4" tone="error">
          {error}
        </StatusMessage>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#343c6a]">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors focus:border-[#2d60ff]"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-[#343c6a]">
            Email
            <span className="ml-1 text-[#ff4b4a]">*</span>
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors focus:border-[#2d60ff]"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-[#343c6a]">
            Password
            <span className="ml-1 text-[#ff4b4a]">*</span>
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className="h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors focus:border-[#2d60ff]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[50px] w-full rounded-[15px] bg-[#1814f3] px-6 text-sm font-medium text-white transition-colors hover:bg-[#2d60ff] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-200"
        >
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="mt-3 h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-6 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
      >
        Continue with Google
      </button>

      <p className="mt-5 text-center text-sm text-[#718ebf]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#1814f3] underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
