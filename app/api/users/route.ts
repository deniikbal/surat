import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/server/guard"

// GET /api/users?q= → daftar user + peran
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  }
  const sp = request.nextUrl.searchParams
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "100", 10) || 100))
  const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0)
  const res = await auth.api.listUsers({
    headers: await headers(),
    query: { limit, offset, sortBy: "createdAt", sortDirection: "asc", ...(sp.get("q")?.trim() ? { searchValue: sp.get("q")!.trim(), searchField: "name" as const } : {}) },
  })
  return NextResponse.json({ users: res.users, total: res.total })
}

// POST /api/users → { name, email, password, role }
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  }
  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const role = body.role === "admin" ? "admin" : "user"
    if (!name || !email || password.length < 8) {
      return NextResponse.json({ error: "Nama & email wajib diisi, password minimal 8 karakter" }, { status: 400 })
    }
    const user = await auth.api.createUser({
      headers: await headers(),
      body: { name, email, password, role },
    })
    return NextResponse.json({ user: { id: user.user.id } })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membuat user"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
