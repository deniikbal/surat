import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"
import {Pool} from "pg"

// better-auth bisa menerima pg.Pool langsung → tabel user/session/account/
// verification dibuat otomatis di database `surat` (terpisah dari rekapin).
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const auth = betterAuth({
  appName: "Sistem Persuratan",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3001"],
  advanced: {
    // nginx (127.0.0.1) + Cloudflare di depan app → IP klien dari header proxy
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminPreferences: { apiKey: false, backupCode: false },
    }),
  ],
})

/** Helper: user dengan peran admin (lihat menu Users + akses /api/users). */
export function isAdmin(user: { role?: string | null } | null | undefined) {
  return user?.role === "admin"
}

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
