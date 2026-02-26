import { AuthBrandingPanel } from './_components/auth-branding-panel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — Branding panel */}
      <AuthBrandingPanel />

      {/* Right — Auth form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
