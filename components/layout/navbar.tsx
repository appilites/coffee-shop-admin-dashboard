"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import Link from "next/link"

const getPageTitle = (pathname: string) => {
  if (pathname === "/") return "Dashboard"
  if (pathname.startsWith("/categories")) return "Categories"
  if (pathname.startsWith("/products")) return "Products"
  if (pathname.startsWith("/orders")) return "Orders"
  if (pathname.startsWith("/settings")) return "Settings"
  return "Dashboard"
}

export function Navbar() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname || "/")

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-card/80 backdrop-blur-sm px-6 shadow-soft"
    >
      <div className="flex items-center gap-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full border-2 border-border/40 hover:border-accent transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground font-semibold">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border-border/40 shadow-soft-lg z-[100]">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@coffeeshop.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/settings" className="flex w-full items-center">
              <User className="mr-2 h-4 w-4" />
              Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/settings" className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
