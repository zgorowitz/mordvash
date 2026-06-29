import { Show, SignInButton } from "@clerk/nextjs";
import { AccessGate } from "../components/access-gate";
import { AppTopbar } from "../components/app-topbar";
import { SettingsManager } from "../components/settings-manager";

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SettingsPage() {
  if (!hasClerkKey) {
    return (
      <main>
        <div className="authNotice">
          <strong>Clerk is wired in.</strong> Add keys in Vercel to turn on sign-in.
        </div>
        <AppTopbar title="Settings" />
        <SettingsManager />
      </main>
    );
  }

  const signedOutView = (
    <section className="signInView">
      <div>
        <p className="eyebrow">Invoice Desk</p>
        <h1>Sign in to manage settings.</h1>
      </div>
      <SignInButton mode="modal">
        <button className="uiButton uiButtonDefault uiButtonDefaultSize">Sign in</button>
      </SignInButton>
    </section>
  );

  return (
    <main>
      <Show when="signed-in" fallback={signedOutView}>
        <AppTopbar title="Settings" />
        <AccessGate>
          <SettingsManager />
        </AccessGate>
      </Show>
    </main>
  );
}
