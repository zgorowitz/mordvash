import { SignOutButton, UserButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
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
        {hasClerkKey && (
          <>
            <SignOutButton redirectUrl="/">
              <button className="topbarLogout">
                <LogOut size={14} />
                Log out
              </button>
            </SignOutButton>
            <UserButton />
          </>
        )}
      </nav>
    </header>
  );
}
