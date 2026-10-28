import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Editor login", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="max-w-sm">
      <h1 className="text-2xl">Editor login</h1>
      <LoginForm />
    </main>
  );
}
