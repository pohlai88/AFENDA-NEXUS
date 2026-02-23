import type { Metadata } from "next";
import { TenantProvider } from "@/providers/tenant-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Afenda",
    template: "%s | Afenda",
  },
  description: "Multi-tenant ERP platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider defaultTheme="system">
          <TenantProvider>
            {children}
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
