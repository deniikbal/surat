"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileTextIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut, useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const MENU = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/input", label: "Input Surat", icon: FileTextIcon },
  { href: "/data", label: "Register", icon: InboxIcon },
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

  async function logout() {
    await signOut({ callbackURL: "/login" })
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Navbar atas */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 md:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-white/15">
              <FileTextIcon className="size-4" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-bold">Persuratan</span>
              <span className="block text-[10px] text-white/60">SMAN 1 Bantarujeg</span>
            </span>
          </Link>

          {/* Menu */}
          <nav className="ml-1 flex items-center gap-1 overflow-x-auto md:ml-6">
            {MENU.map((m) => {
              const active = pathname === m.href
              const Icon = m.icon
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    active ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  {m.label}
                </Link>
              )
            })}
          </nav>

          {/* User login di kanan */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2.5 rounded-lg bg-white/10 py-1 pr-2.5 pl-2.5 sm:flex">
              <Avatar className="size-7 text-[11px]">
                <AvatarFallback className="bg-white/20 font-bold">{initials}</AvatarFallback>
              </Avatar>
              <span className="max-w-44 leading-tight">
                <span className="block truncate text-xs font-semibold">{user?.name || "Petugas"}</span>
                <span className="block truncate text-[10px] text-white/60">{user?.email}</span>
              </span>
            </div>
            <Avatar className="size-7 sm:hidden">
              <AvatarFallback className="bg-white/20 text-[11px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={logout}
                      className="text-white/70 hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
                    >
                      <LogOutIcon />
                    </Button>
                  }
                >
                  <span className="sr-only">Keluar</span>
                </TooltipTrigger>
                <TooltipContent>Keluar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">{children}</main>
    </div>
  )
}
