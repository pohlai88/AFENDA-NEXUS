export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Afenda</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              disabled
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              disabled
            />
          </div>
          <button
            type="button"
            disabled
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Authentication will be wired once the auth middleware is implemented.
        </p>
      </div>
    </main>
  );
}
