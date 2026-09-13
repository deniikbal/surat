import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/server/guard"

// PATCH /api/users/:id → { role?, name?, email?, newPassword? }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin()
  if (!me) return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  const { id } = await params
  if (id === me.user.id) {
    return NextResponse.json({ error: "Tidak bisa mengubah akun sendiri lewat halaman ini" }, { status: 400 })
  }
  try {
    const body = await request.json()
    const role = body.role === "admin" || body.role === "user" ? body.role : undefined
    await auth.api.adminUpdateUser({
      headers: await headers(),
      body: {
        userId: id,
        data: { ...(role ? { role } : {}) },
      },
    })
    if (body.newPassword && String(body.newPassword).length >= 8) {
      await auth.api.setUserPassword({
        headers: await headers(),
        body: { userId: id, newPassword: String(body.newPassword) },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengubah user"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// DELETE /api/users/:id → hapus user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin()
  if (!me) return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  const { id } = await params
  if (id === me.user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 })
  }
  try {
    await auth.api.removeUser({
      headers: await headers(),
      body: { userId: id },
    })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus user"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
