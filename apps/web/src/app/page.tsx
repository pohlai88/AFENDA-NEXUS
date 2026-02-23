import { redirect } from "next/navigation";

export default function RootPage() {
  // Root page redirects to login; authenticated users are routed via (shell) layout
  redirect("/login");
}
