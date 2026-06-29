import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { InvoiceWorkspace } from "./components/invoice-workspace";

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function Home() {
  if (!hasClerkKey) {
    return (
      <main>
        <div className="authNotice">
          <strong>Clerk is wired in.</strong> Add your keys to `.env.local` to turn on sign-in.
        </div>
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
        <button className="primaryButton">Sign in</button>
      </SignInButton>
    </section>
  );

  return (
    <main>
      <Show when="signed-in" fallback={signedOutView}>
        <header className="topbar">
          <div>
            <p className="eyebrow">Invoice Desk</p>
            <h1>Invoices</h1>
          </div>
          <UserButton />
        </header>
        <InvoiceWorkspace />
      </Show>
    </main>
  );
}
