import { headers } from "next/headers"
import { auth, isAdmin } from "@/lib/auth"

// Proxy sudah memastikan login; peran dicek ulang di sini (trust boundary).
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !isAdmin(session.user)) return null
  return session
}
