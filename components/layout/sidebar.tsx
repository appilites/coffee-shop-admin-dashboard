"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Settings,
  Coffee,
  LogOut,
  Gift,
  Layers,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: FolderTree,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Variations",
    href: "/variations",
    icon: Layers,
  },
  {
    title: "Bulk Addons",
    href: "/bulk-addons",
    icon: Package,
  },
  {
    title: "New Arrivals",
    href: "/new-arrivals",
    icon: Sparkles,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Loyalty",
    href: "/loyalty",
    icon: Gift,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  if (!mounted) {
    return (
      <aside className="flex h-screen w-64 flex-col border-r border-border/40 bg-card shadow-soft fixed left-0 top-0 overflow-hidden">
        <div className="flex h-20 items-center border-b border-border/40 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-muted">
              <Coffee className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground">Admin</span>
          </div>
        </div>
        <div className="flex-1 p-4" />
        <div className="border-t border-border/40 p-4">
          <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      </aside>
    )
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen w-64 flex-col border-r border-border/40 bg-card shadow-soft fixed left-0 top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-border/40 px-6">
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-muted">
            <Coffee className="h-6 w-6 text-muted-foreground" />
          </div>
          <span className="font-serif text-xl font-bold text-foreground">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto scrollbar-hide">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

          return (
            <motion.div
              key={item.href}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-border/40 p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl border-border/40 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-border/40 shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">
                Confirm Logout
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to log out of the admin dashboard?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel className="min-w-[6rem]">
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                className="min-w-[6rem]"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.aside>
  )
}
