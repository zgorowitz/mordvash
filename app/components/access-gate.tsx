"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { isEmailInvited } from "../lib/invoice-store";
import { useAppData } from "../lib/use-app-data";

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AccessGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { state, ready } = useAppData({ persist: false });

  if (!hasClerkKey) {
    return children;
  }

  if (!isLoaded || !ready) {
    return <section className="accessPanel">Loading access...</section>;
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const invited = isSignedIn && isEmailInvited(email, state.invitations);

  if (!invited) {
    return (
      <section className="accessPanel">
        <div>
          <p className="eyebrow">Access</p>
          <h2>Email not invited</h2>
          <p className="muted">{email || "This account"} is not on the invoice workspace invitation list.</p>
        </div>
        <SignOutButton redirectUrl="/">
          <button className="uiButton uiButtonDefault uiButtonDefaultSize">
            <LogOut size={15} />
            Log out
          </button>
        </SignOutButton>
      </section>
    );
  }

  return children;
}
