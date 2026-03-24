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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
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
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-soft">
              <Coffee className="h-6 w-6 text-primary" />
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
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-soft"
          >
            <Coffee className="h-6 w-6 text-primary" />
          </motion.div>
          <span className="font-serif text-xl font-bold text-foreground group-hover:text-accent transition-colors">
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
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <span>{item.title}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
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
          <AlertDialogContent className="bg-white border-border/40 shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif">Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out of the admin dashboard?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2 flex flex-row flex-wrap items-center justify-end gap-2 sm:justify-end [&>button]:min-w-[6rem]">
              <AlertDialogCancel className="m-0 cursor-pointer border-border/60">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="m-0 cursor-pointer border-0 bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/30"
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.aside>
  )
}
