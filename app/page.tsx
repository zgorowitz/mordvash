import { Show, SignInButton } from "@clerk/nextjs";
import { AccessGate } from "./components/access-gate";
import { AppTopbar } from "./components/app-topbar";
import { InvoiceWorkspace } from "./components/invoice-workspace";

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function Home() {
  if (!hasClerkKey) {
    return (
      <main>
        <div className="authNotice">
          <strong>Clerk is wired in.</strong> Add keys in Vercel to turn on sign-in.
        </div>
        <AppTopbar title="Invoices" />
        <InvoiceWorkspace />
      </main>
    );
  }

  const signedOutView = (
    <section className="signInView">
      <div>
        <p className="eyebrow">Invoice Desk</p>
        <h1>Sign in to manage invoices.</h1>
        <p>Folders, vendor presets, invoice edits, and history are kept together in one small workspace.</p>
      </div>
      <SignInButton mode="modal">
        <button className="uiButton uiButtonDefault uiButtonDefaultSize">Sign in</button>
      </SignInButton>
    </section>
  );

  return (
    <main>
      <Show when="signed-in" fallback={signedOutView}>
        <AppTopbar title="Invoices" />
        <AccessGate>
          <InvoiceWorkspace />
        </AccessGate>
      </Show>
    </main>
  );
}
