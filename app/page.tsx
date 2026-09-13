import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import LandingView from "./landing-view"

// Halaman root = landing publik; kalau sudah login, langsung ke dashboard.
export default async function RootPage() {
  const h = await import("next/headers")
  const session = await auth.api.getSession({ headers: await h.headers() })
  if (session) redirect("/dashboard")
  return <LandingView />
}
