"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = { google: boolean; testLogin: boolean };

export function LoginForm({ google, testLogin }: Props) {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const checkEmail = params.has("check-email");
  const failed = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function magicLink(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await signIn("nodemailer", { email, redirectTo: callbackUrl });
    setBusy(false);
  }

  async function passwordLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await signIn("test-login", { email, password, redirectTo: callbackUrl });
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      {checkEmail && (
        <div role="status" className="alert alert-info">
          Check your email for a sign-in link.
        </div>
      )}
      {failed && (
        <div role="alert" className="alert alert-error">
          Sign-in failed. Please try again.
        </div>
      )}

      <form onSubmit={magicLink} className="space-y-3">
        <h2 className="text-xl font-semibold">Email me a sign-in link</h2>
        <label className="block">
          <span className="mb-1 block text-sm">Email address</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          Send link
        </button>
      </form>

      {google && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => signIn("google", { redirectTo: callbackUrl })}
        >
          Continue with Google
        </button>
      )}

      {testLogin && (
        <form onSubmit={passwordLogin} className="space-y-3 rounded border border-warning p-4">
          <h2 className="text-xl font-semibold">Test login</h2>
          <p className="text-sm">Automated-test sign-in. Never enabled in production.</p>
          <label className="block">
            <span className="mb-1 block text-sm">Test email</span>
            <input
              type="email"
              required
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">Test password</span>
            <input
              type="password"
              required
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-warning" disabled={busy}>
            Sign in (test)
          </button>
        </form>
      )}
    </div>
  );
}
