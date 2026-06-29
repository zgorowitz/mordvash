import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AppTopbar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Invoice Desk</p>
        <h1>{title}</h1>
      </div>
      <nav className="topnav" aria-label="Primary">
        <Link href="/">Invoices</Link>
        <Link href="/settings">Settings</Link>
        {hasClerkKey && <UserButton />}
      </nav>
    </header>
  );
}
