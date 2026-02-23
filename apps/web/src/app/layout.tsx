import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Afenda",
  description: "Multi-tenant ERP platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
