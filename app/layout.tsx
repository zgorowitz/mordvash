import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Desk",
  description: "Small invoice workspace with folders, presets, and edit history."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const page = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );

  if (!hasClerkKey) {
    return page;
  }

  return <ClerkProvider>{page}</ClerkProvider>;
}
