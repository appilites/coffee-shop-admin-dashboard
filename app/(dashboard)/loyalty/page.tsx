"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Gift, Plus, Trash2, Edit, Loader2, Star, ShoppingBag, RefreshCw, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProductImage } from "@/components/ui/product-image"

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  loyalty_points_earn: number
  loyalty_points_cost: number
  is_available: boolean
  category?: { id: string; name: string } | null
}

export default function LoyaltyPage() {
  const [rewards, setRewards] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Add reward dialog
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState("")
  const [pointsCost, setPointsCost] = useState("")
  const [saving, setSaving] = useState(false)
  const [productComboOpen, setProductComboOpen] = useState(false)

  // Edit reward dialog
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editPointsCost, setEditPointsCost] = useState("")

  // Remove confirm
  const [removeId, setRemoveId] = useState<string | null>(null)

  // DB setup check
  const [dbReady, setDbReady] = useState<boolean | null>(null)
  const [setupSql, setSetupSql] = useState("")

  useEffect(() => { loadData() }, [])

  const loadData = async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      // Check if columns exist
      const setupRes = await fetch('/api/setup/add-loyalty-columns')
      const setupData = await setupRes.json()
      if (!setupData.columnsExist) {
        setDbReady(false)
        setSetupSql(setupData.sql || "")
        return
      }
      setDbReady(true)

      const res = await fetch('/api/loyalty')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setRewards(data.rewards ?? [])
      setAllProducts(data.allProducts ?? [])
    } catch {
      toast.error('Failed to load loyalty data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAddReward = async () => {
    if (!selectedProductId || !pointsCost) return
    const cost = parseInt(pointsCost)
    if (isNaN(cost) || cost <= 0) { toast.error('Enter a valid points value'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/loyalty/${selectedProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loyaltyPointsCost: cost }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Loyalty reward added!')
      setIsAddOpen(false)
      setSelectedProductId("")
      setPointsCost("")
      loadData(true)
    } catch (e: any) {
      toast.error(e.message || 'Failed to add reward')
    } finally {
      setSaving(false)
    }
  }

  const handleEditReward = async () => {
    if (!editProduct || !editPointsCost) return
    const cost = parseInt(editPointsCost)
    if (isNaN(cost) || cost <= 0) { toast.error('Enter a valid points value'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/loyalty/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loyaltyPointsCost: cost }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Reward updated!')
      setEditProduct(null)
      loadData(true)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update reward')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/loyalty/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Reward removed')
      setRemoveId(null)
      loadData(true)
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove reward')
    }
  }

  // Products not yet set as rewards
  const availableToAdd = allProducts.filter(p => p.loyalty_points_cost === 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading loyalty program...</p>
        </div>
      </div>
    )
  }

  // DB columns not set up yet
  if (dbReady === false) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Loyalty Program</h2>
          <p className="text-muted-foreground mt-1">Set up required before use</p>
        </div>
        <Card className="border-border/40 shadow-soft">
          <CardContent className="py-8 text-center space-y-4">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-serif text-xl font-semibold">Database Setup Required</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Run this SQL in your <strong>Supabase SQL Editor</strong> to enable loyalty columns, then refresh.
            </p>
            <pre className="text-left bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto border border-border">
              {setupSql}
            </pre>
            <Button onClick={() => loadData()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Loyalty Program
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage loyalty rewards — customers redeem points for free products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-soft">
            <Plus className="h-4 w-4" />
            Add Reward
          </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Card className="border-border/40 shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-serif">{rewards.length}</p>
              <p className="text-xs text-muted-foreground">Loyalty Rewards</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-serif">
                {rewards.length > 0 ? Math.min(...rewards.map(r => r.loyalty_points_cost)) : 0}
              </p>
              <p className="text-xs text-muted-foreground">Min Points to Redeem</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-serif">
                {allProducts.filter(p => p.loyalty_points_earn > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Products Earning Points</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rewards List */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/40 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-xl">Loyalty Rewards</CardTitle>
            <CardDescription>
              Products customers can get for free by redeeming their loyalty points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rewards.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No loyalty rewards yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Reward" to set a product as a free loyalty reward
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {rewards.map((reward, i) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      {/* Product image */}
                      <div className="h-14 w-14 rounded-lg overflow-hidden border border-border/40 shrink-0 bg-muted">
                        <ProductImage
                          src={reward.image_url ?? undefined}
                          alt={reward.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{reward.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {reward.category?.name ?? "—"} · ${reward.base_price.toFixed(2)} value
                        </p>
                      </div>

                      {/* Points badge */}
                      <div className="shrink-0 text-center px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-lg font-bold font-serif text-primary leading-none">
                          {reward.loyalty_points_cost}
                        </p>
                        <p className="text-[10px] text-primary/70 font-medium mt-0.5">POINTS</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditProduct(reward); setEditPointsCost(String(reward.loyalty_points_cost)) }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoveId(reward.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Points Earning Table */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-border/40 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-xl">Points Earned Per Product</CardTitle>
            <CardDescription>
              Products that give customers loyalty points when purchased. Edit these from the product form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allProducts.filter(p => p.loyalty_points_earn > 0).length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No products are awarding points yet. Set "Loyalty Points Earned" on any product to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProducts
                  .filter(p => p.loyalty_points_earn > 0)
                  .sort((a, b) => b.loyalty_points_earn - a.loyalty_points_earn)
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors">
                      <div className="h-8 w-8 rounded-md overflow-hidden border border-border/40 shrink-0 bg-muted">
                        <ProductImage src={p.image_url ?? undefined} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                        +{p.loyalty_points_earn} pts
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Reward Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Add Loyalty Reward
            </DialogTitle>
            <DialogDescription>
              Select a product and set how many points a customer needs to redeem it for free.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Product <span className="text-destructive">*</span></Label>
              <Popover open={productComboOpen} onOpenChange={setProductComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-white border-border/60 font-normal text-left"
                  >
                    {selectedProductId
                      ? availableToAdd.find(p => p.id === selectedProductId)?.name ?? "Select a product..."
                      : <span className="text-muted-foreground">Search & select a product...</span>
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[400px] p-0 bg-white" align="start">
                  <Command>
                    <CommandInput placeholder="Search products..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {availableToAdd.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            All products are already rewards
                          </div>
                        ) : (
                          availableToAdd.map(p => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                setSelectedProductId(p.id)
                                setProductComboOpen(false)
                              }}
                              className="flex items-center gap-3 py-2.5 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  selectedProductId === p.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="h-8 w-8 rounded-md overflow-hidden border border-border/40 shrink-0 bg-muted">
                                <ProductImage
                                  src={p.image_url ?? undefined}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.category?.name ?? "—"} · ${p.base_price.toFixed(2)}
                                </p>
                              </div>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsCost">
                Points Required to Redeem <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pointsCost"
                type="number"
                min={1}
                step={1}
                value={pointsCost}
                onChange={e => setPointsCost(e.target.value)}
                placeholder="e.g. 100"
                className="bg-white border-border/60"
              />
              <p className="text-xs text-muted-foreground">
                Customers with at least this many points can redeem this product for free.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setSelectedProductId(""); setPointsCost(""); setProductComboOpen(false) }}>
              Cancel
            </Button>
            <Button onClick={handleAddReward} disabled={saving || !selectedProductId || !pointsCost}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reward Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(o) => { if (!o) setEditProduct(null) }}>
        <DialogContent className="sm:max-w-[420px] bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Edit Reward Points
            </DialogTitle>
            <DialogDescription>
              Updating points for: <span className="font-medium text-foreground">{editProduct?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="editPointsCost">
              Points Required to Redeem <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editPointsCost"
              type="number"
              min={1}
              step={1}
              value={editPointsCost}
              onChange={e => setEditPointsCost(e.target.value)}
              className="bg-white border-border/60"
            />
            <p className="text-xs text-muted-foreground">
              Customers need at least this many points to redeem this product for free.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button onClick={handleEditReward} disabled={saving || !editPointsCost}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm */}
      <AlertDialog open={!!removeId} onOpenChange={(o) => { if (!o) setRemoveId(null) }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Loyalty Reward?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will no longer be redeemable with loyalty points. The product itself won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={() => removeId && handleRemove(removeId)}>
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
