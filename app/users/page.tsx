"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Shell } from "@/components/shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { isAdmin, useSession } from "@/lib/auth-client"

type UserRow = {
  id: string
  name: string | null
  email: string
  role: string | null
  createdAt: string
}

function initial(name: string | null, email: string) {
  return (name || email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export default function UsersPage() {
  const { data: session, isPending } = useSession()
  const me = session?.user
  const admin = isAdmin(me)

  const [rows, setRows] = useState<UserRow[] | null>(null)
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [form, setForm] = useState<{ open: boolean; edit: UserRow | null }>({ open: false, edit: null })
  const [del, setDel] = useState<UserRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    if (!admin) return
    try {
      const res = await fetch(`/api/users${debouncedQ.trim() ? `?q=${encodeURIComponent(debouncedQ.trim())}` : ""}`)
      const data = await res.json()
      if (res.status === 403) {
        setMsg({ ok: false, text: "Hanya admin yang bisa membuka halaman ini." })
        setRows([])
        return
      }
      setRows(Array.isArray(data.users) ? data.users : [])
    } catch {
      setRows([])
    }
  }, [admin, debouncedQ])

  useEffect(() => {
    if (admin) load()
  }, [admin, load])

  async function confirmDelete() {
    if (!del) return
    setBusy(true)
    try {
      const res = await fetch(`/api/users/${del.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Gagal menghapus" })
        return
      }
      setMsg({ ok: true, text: `User ${del.email} dihapus.` })
      setDel(null)
      load()
    } catch {
      setMsg({ ok: false, text: "Koneksi gagal, coba lagi" })
    } finally {
      setBusy(false)
    }
  }

  // akses non-admin ke halaman ini → tolak tampil
  if (!isPending && !admin) {
    return (
      <Shell>
        <Empty className="border-0 py-24">
          <EmptyHeader>
            <EmptyMedia variant="icon"><ShieldCheckIcon /></EmptyMedia>
            <EmptyTitle>Akses ditolak</EmptyTitle>
            <EmptyDescription>Halaman Users hanya untuk admin.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <UsersIcon className="size-4.5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight">Users</h1>
              <p className="text-xs text-muted-foreground">{rows?.length ?? "-"} akun terdaftar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InputGroup className="w-56 md:w-72">
              <InputGroupAddon><SearchIcon /></InputGroupAddon>
              <InputGroupInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / email..." />
              {q ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" variant="ghost" onClick={() => setQ("")} title="Bersihkan">
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            <Button onClick={() => setForm({ open: true, edit: null })}>
              <PlusIcon /> Tambah User
            </Button>
          </div>
        </div>

        {msg ? (
          <Alert variant={msg.ok ? "default" : "destructive"} className={msg.ok ? "border-success/30 bg-success/10 text-success" : undefined}>
            <AlertDescription>{msg.text}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden py-0">
          {rows === null ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty className="border-0 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon"><UsersIcon /></EmptyMedia>
                <EmptyTitle>Belum ada user</EmptyTitle>
                <EmptyDescription>Klik Tambah User untuk membuat akun.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px] text-sm">
                <TableHeader className="bg-muted/50 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase [&_th]:h-auto [&_th]:px-4 [&_th]:py-3">
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/70">
                  {rows.map((u) => (
                    <TableRow key={u.id} className="transition hover:bg-muted/40">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                              {initial(u.name, u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name || "-"}</span>
                          {u.id === me?.id ? (
                            <Badge variant="outline" className="ml-1">Anda</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? <ShieldCheckIcon data-icon="inline-start" /> : <UserIcon data-icon="inline-start" />}
                          {u.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(u.createdAt))}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {u.id !== me?.id ? (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button variant="ghost" size="icon" onClick={() => setForm({ open: true, edit: u })} className="text-muted-foreground hover:bg-primary/10 hover:text-primary">
                                        <PencilIcon />
                                      </Button>
                                    }
                                  >
                                    <span className="sr-only">Ubah user</span>
                                  </TooltipTrigger>
                                  <TooltipContent>Ubah role / reset password</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button variant="ghost" size="icon" onClick={() => setDel(u)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2Icon />
                                      </Button>
                                    }
                                  >
                                    <span className="sr-only">Hapus user</span>
                                  </TooltipTrigger>
                                  <TooltipContent>Hapus user</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {form.open ? (
        <UserFormDialog
          key={form.edit?.id ?? "new"}
          edit={form.edit}
          onClose={() => setForm({ open: false, edit: null })}
          onSaved={(m) => { setMsg(m); load() }}
        />
      ) : null}

      <AlertDialog open={!!del} onOpenChange={(o) => !o && !busy && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2Icon /></AlertDialogMedia>
            <AlertDialogTitle>Hapus user ini?</AlertDialogTitle>
            <AlertDialogDescription>User tidak bisa masuk lagi setelah dihapus. Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          {del ? (
            <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
              <span className="font-semibold">{del.name || "-"}</span>
              <span className="mx-1.5 text-muted-foreground">•</span>
              <span className="font-mono text-xs">{del.email}</span>
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2Icon /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  )
}

function UserFormDialog({
  edit, onClose, onSaved,
}: {
  edit: UserRow | null
  onClose: () => void
  onSaved: (m: { ok: boolean; text: string }) => void
}) {
  const isEdit = !!edit
  const [name, setName] = useState(edit?.name ?? "")
  const [email, setEmail] = useState(edit?.email ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(edit?.role === "admin" ? "admin" : "user")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const res = isEdit
        ? await fetch(`/api/users/${edit.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, ...(password ? { newPassword: password } : {}) }),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
          })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || "Gagal menyimpan")
        return
      }
      onSaved({ ok: true, text: isEdit ? `User ${email} diperbarui.` : `User ${email} dibuat.` })
      onClose()
    } catch {
      setErr("Koneksi gagal, coba lagi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !saving && !o && onClose()}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-sm font-bold">{isEdit ? "Ubah User" : "Tambah User"}</DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit ? "Ubah role atau reset password user." : "Buat akun baru untuk petugas TU / pimpinan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="grid gap-4 py-2">
            {!isEdit ? (
              <>
                <div>
                  <Label htmlFor="u-name">Nama lengkap *</Label>
                  <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" placeholder="mis. Siti Admin TU" />
                </div>
                <div>
                  <Label htmlFor="u-email">Email *</Label>
                  <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" placeholder="tu@smansaba.sch.id" />
                </div>
                <div>
                  <Label htmlFor="u-pass">Password * (min. 8 karakter)</Label>
                  <Input id="u-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1.5" autoComplete="new-password" />
                </div>
              </>
            ) : (
              <div>
                <Label>Reset Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="mt-1.5" placeholder="Kosongkan jika tidak diganti" autoComplete="new-password" />
              </div>
            )}

            <div>
              <Label>Role</Label>
              <NativeSelect value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full">
                <option value="user">User — lihat &amp; catat surat</option>
                <option value="admin">Admin — semua akses + kelola user</option>
              </NativeSelect>
            </div>

            {err ? <p className="text-xs font-medium text-destructive">{err}</p> : null}
          </div>

          <Separator />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : <CheckIcon />}
              {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
