"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-4 flex flex-col gap-3 font-sans">
      <label htmlFor="password" className="text-base font-semibold">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="rounded-lg border border-line bg-card p-3 text-base text-fg"
      />
      {error && (
        <p role="alert" className="text-base text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-base text-accent-fg disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
