"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  InboxIcon,
  LogOutIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { SuratFormDialog, type Jenis } from "@/components/surat-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isAdmin, signOut, useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const MENU = [
  { href: "/surat-masuk", label: "Surat Masuk", icon: InboxIcon },
  { href: "/surat-keluar", label: "Surat Keluar", icon: SendIcon },
  { href: "/users", label: "Users", icon: UsersIcon, adminOnly: true },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()

  // Modal "Catat Surat" dari navbar: jenis otomatis mengikuti halaman saat ini.
  const [createOpen, setCreateOpen] = useState(false)
  const [createJenis, setCreateJenis] = useState<Jenis>("masuk")
  const [refreshKey, setRefreshKey] = useState(0)

  function openCreate() {
    setCreateJenis(pathname === "/surat-keluar" ? "keluar" : "masuk")
    setCreateOpen(true)
  }

  // Halaman surat mendengarkan event ini untuk refresh daftar setelah create.
  useEffect(() => {
    function onSaved() {
      setRefreshKey((k) => k + 1)
    }
    window.addEventListener("surat-saved", onSaved)
    return () => window.removeEventListener("surat-saved", onSaved)
  }, [])

  async function logout() {
    // Paksa ke halaman root; / menangani redirect sesuai status login.
    await signOut()
    window.location.href = "/"
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Navbar atas */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 md:px-6 lg:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <BrandLogo className="size-8 rounded-lg" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-bold">Persuratan</span>
              <span className="block text-[10px] text-foreground/60">SMAN 1 Bantarujeg</span>
            </span>
          </Link>

          {/* Menu */}
          <nav className="ml-1 flex items-center gap-1 overflow-x-auto md:ml-6">
            {MENU.filter((m) => !m.adminOnly || isAdmin(user)).map((m) => {
              const active = pathname === m.href
              const Icon = m.icon
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    active ? "bg-black/10 text-foreground" : "text-foreground/70 hover:bg-black/5 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {m.label}
                </Link>
              )
            })}
          </nav>

          {/* Aksi cepat + user dropdown di kanan */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="hidden h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background transition hover:bg-foreground/85 sm:flex"
            >
              <CheckCircle2Icon className="size-3.5" />
              Catat Surat
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg bg-black/10 py-1 pr-2 pl-2.5 text-left transition hover:bg-black/15 focus-visible:outline-2 focus-visible:outline-foreground/40">
                <Avatar className="size-7 text-[11px]">
                  <AvatarFallback className="bg-black/15 font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-44 leading-tight sm:block">
                  <span className="block truncate text-xs font-semibold">{user?.name || "Petugas"}</span>
                  <span className="block truncate text-[10px] text-foreground/60">{user?.email}</span>
                </span>
                <ChevronDownIcon className="hidden size-3.5 text-foreground/60 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="leading-tight">
                    <span className="block text-xs font-semibold">{user?.name || "Petugas"}</span>
                    <span className="block truncate text-[11px] font-normal text-muted-foreground">{user?.email}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={logout}>
                  <LogOutIcon />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">{children}</main>

      {/* Modal create global — terpasang di semua halaman ber-Shell */}
      {createOpen ? (
        <SuratFormDialog
          key={`${createJenis}-new-${refreshKey}`}
          jenis={createJenis}
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o)
            if (!o) window.dispatchEvent(new Event("surat-saved-check"))
          }}
          onSaved={(m) => {
            window.dispatchEvent(new CustomEvent("surat-saved", { detail: m }))
          }}
        />
      ) : null}
    </div>
  )
}
