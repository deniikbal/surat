"use client"

import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [adminClient()],
})

export const { useSession, signIn, signOut, signUp } = authClient
export const { admin } = authClient

export function isAdmin(user: { role?: string | null } | null | undefined) {
  return user?.role === "admin"
}
