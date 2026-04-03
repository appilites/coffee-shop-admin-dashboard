"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronLeft, Loader2, Megaphone, Plus, Pencil, Trash2, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProductImage } from "@/components/ui/product-image"
import { toast } from "sonner"

type Promotion = {
  id: string
  name: string
  imageUrl: string
  description: string | null
  menuItemId: string | null
  externalUrl: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  product: { id: string; name: string; imageUrl: string | null; basePrice: number } | null
}

type ProductRow = { id: string; name: string; base_price?: number }

export default function PromotionsSettingsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    imageUrl: "",
    description: "",
    menuItemId: "" as string,
    externalUrl: "",
    isActive: true,
    sortOrder: 0,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prRes, prodRes] = await Promise.all([
        fetch("/api/promotions", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
      ])
      if (!prRes.ok) {
        const e = await prRes.json().catch(() => ({}))
        const msg = [e.details, e.hint, e.error].filter(Boolean).join(" — ") || `HTTP ${prRes.status}`
        throw new Error(msg)
      }
      if (prodRes.ok) {
        const prods = await prodRes.json()
        setProducts(
          Array.isArray(prods)
            ? prods.map((p: { id: string; name: string; base_price?: number }) => ({
                id: p.id,
                name: p.name,
                base_price: p.base_price,
              }))
            : []
        )
      }
      const list = await prRes.json()
      setPromotions(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: "",
      imageUrl: "",
      description: "",
      menuItemId: "",
      externalUrl: "",
      isActive: true,
      sortOrder: promotions.length,
    })
    setImageFile(null)
    setPreview(null)
    setDialogOpen(true)
  }

  const openEdit = (p: Promotion) => {
    setEditing(p)
    setForm({
      name: p.name,
      imageUrl: p.imageUrl,
      description: p.description || "",
      menuItemId: p.menuItemId || "",
      externalUrl: p.externalUrl || "",
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    })
    setImageFile(null)
    setPreview(null)
    setDialogOpen(true)
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Promotion name is required")
      return
    }
    let imageUrl = form.imageUrl.trim()
    if (imageFile) {
      const fd = new FormData()
      fd.append("file", imageFile)
      fd.append("folder", "promotions")
      const up = await fetch("/api/upload", { method: "POST", body: fd })
      if (!up.ok) {
        const e = await up.json().catch(() => ({}))
        toast.error(e.error || "Image upload failed")
        return
      }
      const { url } = await up.json()
      imageUrl = url
    }
    if (!imageUrl) {
      toast.error("Add an image (upload or URL)")
      return
    }

    setSaving(true)
    try {
      const base = {
        name: form.name.trim(),
        imageUrl,
        description: form.description.trim() || null,
        menuItemId: form.menuItemId.trim() || null,
        externalUrl: form.externalUrl.trim() || null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      }
      const url = editing ? `/api/promotions/${editing.id}` : "/api/promotions"
      const method = editing ? "PUT" : "POST"
      const body =
        method === "POST"
          ? {
              name: base.name,
              imageUrl: base.imageUrl,
              ...(base.description ? { description: base.description } : {}),
              ...(base.menuItemId ? { menuItemId: base.menuItemId } : {}),
              ...(base.externalUrl ? { externalUrl: base.externalUrl } : {}),
              isActive: base.isActive,
              sortOrder: base.sortOrder,
            }
          : base
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.details || "Save failed")
      toast.success(editing ? "Promotion updated" : "Promotion created")
      setDialogOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/promotions/${deleteId}`, { method: "DELETE" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Delete failed")
      }
      toast.success("Promotion removed")
      setDeleteId(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 border-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">Promotions</h2>
            <p className="mt-1 text-muted-foreground">
              Banners for the shop — image, name, optional product link
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add promotion
        </Button>
      </motion.div>

      {promotions.length === 0 ? (
        <Card className="border-border/40 shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No promotions yet. Create one for your shop homepage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promotions.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="overflow-hidden border-border/40 shadow-soft">
                <div className="relative aspect-[21/9] w-full bg-muted">
                  <ProductImage src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg">{p.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{p.description || "—"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {p.product && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">{p.product.name}</span>
                    </div>
                  )}
                  {p.externalUrl && (
                    <p className="truncate text-xs text-muted-foreground">{p.externalUrl}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive"
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Edit promotion" : "New promotion"}</DialogTitle>
            <DialogDescription>Image and name show on the shop; link a product optionally.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Weekend Latte Deal"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Image *</Label>
              <Input type="file" accept="image/*" onChange={handleImage} className="bg-background" />
              {(preview || form.imageUrl) && (
                <div className="relative mt-2 aspect-[21/9] w-full overflow-hidden rounded-md border border-border bg-muted">
                  <ProductImage
                    src={preview || form.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Link to product (optional)</Label>
              <Select
                value={form.menuItemId || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, menuItemId: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="No product link" />
                </SelectTrigger>
                <SelectContent className="z-[220] max-h-64 bg-white">
                  <SelectItem value="__none__">— None —</SelectItem>
                  {products.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id}>
                      {pr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>External URL (optional)</Label>
              <Input
                value={form.externalUrl}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                placeholder="https://..."
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Shop can open this if you do not link a product.</p>
            </div>
          </div>
          <DialogFooter className="flex flex-row flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete promotion?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row flex-wrap gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
