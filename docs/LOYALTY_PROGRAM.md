# Loyalty Program — Integration Guide

This document explains how the loyalty program works in the admin dashboard, how the database is structured, what API endpoints are available, and how to integrate point earning/redemption into the customer-facing shop.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [How It Works](#how-it-works)
4. [Admin Dashboard Features](#admin-dashboard-features)
5. [API Reference](#api-reference)
6. [Shop Frontend Integration](#shop-frontend-integration)
7. [Example Flows](#example-flows)
8. [FAQ](#faq)

---

## Overview

The loyalty program allows customers to:

- **Earn points** every time they purchase a product (based on `loyalty_points_earn` set per product).
- **Redeem points** to claim a specific product for free (based on `loyalty_points_cost` set per product).

Admin controls everything through the **Loyalty** section in the sidebar of the dashboard.

---

## Database Setup

Two columns are added to the existing `menu_items` table in Supabase:

| Column | Type | Default | Description |
|---|---|---|---|
| `loyalty_points_earn` | `INTEGER` | `0` | Points a customer earns when they buy this product |
| `loyalty_points_cost` | `INTEGER` | `0` | Points required to redeem this product for free. `0` means it is not a reward |

### Run this SQL in your Supabase SQL Editor

```sql
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS loyalty_points_earn INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS loyalty_points_cost INTEGER DEFAULT 0 NOT NULL;
```

> **Tip:** You can also trigger this automatically by calling `POST /api/setup/add-loyalty-columns` once from your admin dashboard. The Loyalty page will show a setup banner with the SQL if the columns are missing.

### Customer Points Table (you manage this in your shop DB)

You will also need a table to track each customer's accumulated points. Create it like this:

```sql
CREATE TABLE IF NOT EXISTS customer_loyalty_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Optional: transaction log for auditing
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id     UUID,
  product_id   TEXT,
  points       INTEGER NOT NULL,   -- positive = earned, negative = redeemed
  reason       TEXT,               -- e.g. 'purchase', 'redemption'
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

## How It Works

```
Customer buys a product
        │
        ▼
  loyalty_points_earn > 0?
        │ YES
        ▼
  Add points to customer's balance
        │
        ▼
  Customer balance >= loyalty_points_cost of a reward product?
        │ YES
        ▼
  Customer can redeem that product for FREE
        │
        ▼
  Deduct loyalty_points_cost from customer's balance
  Mark order item as redeemed
```

### Key Rules

- A product earns `0` points by default. Set `loyalty_points_earn` in the product edit form or Loyalty page to enable point earning.
- A product is **not** a reward by default (`loyalty_points_cost = 0`). Set a value > 0 to make it redeemable.
- A product can simultaneously **earn** points AND **be a reward** (e.g., a smoothie earns 5 points and costs 100 points to redeem).
- Removing a reward sets `loyalty_points_cost` back to `0` — it does not delete the product.

---

## Admin Dashboard Features

### Loyalty Page (`/loyalty`)

| Section | What it does |
|---|---|
| **Rewards** tab | Lists all products configured as rewards, showing the points cost and earn value |
| **Add Reward** button | Opens a searchable product picker + points cost input |
| **Edit** button on reward card | Update points cost or earn value |
| **Remove** button on reward card | Sets `loyalty_points_cost = 0` (product is no longer a reward) |
| **Products earning points** section | Shows all products where `loyalty_points_earn > 0` |
| Setup banner | Appears if DB columns are missing, with SQL to run |

### Product Edit Form (`/products/[id]/edit`)

The **"Loyalty Points Earned"** field on each product's edit page lets you set `loyalty_points_earn` directly when editing a product, without going to the Loyalty page.

---

## API Reference

### Setup

#### `GET /api/setup/add-loyalty-columns`
Check whether the loyalty columns exist in the database.

**Response (columns exist):**
```json
{ "columnsExist": true, "sample": [...] }
```

**Response (columns missing):**
```json
{
  "columnsExist": false,
  "sql": "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ..."
}
```

#### `POST /api/setup/add-loyalty-columns`
Attempt to add the columns automatically via `exec_sql` RPC. Falls back to returning the SQL if the RPC is not available.

---

### Loyalty Rewards

#### `GET /api/loyalty`
Fetch all loyalty rewards and the full product list (for the product picker).

**Response:**
```json
{
  "rewards": [
    {
      "id": "item-001",
      "name": "Mango Smoothie",
      "base_price": 5.50,
      "image_url": "https://...",
      "loyalty_points_earn": 10,
      "loyalty_points_cost": 100,
      "is_available": true,
      "category": { "id": "cat-01", "name": "Smoothies" }
    }
  ],
  "allProducts": [ ... ]
}
```

#### `PUT /api/loyalty/:id`
Update loyalty points for a specific product.

**Request body:**
```json
{
  "loyaltyPointsEarn": 10,
  "loyaltyPointsCost": 100
}
```
Both fields are optional. Omit one to leave it unchanged.

**Response:**
```json
{
  "id": "item-001",
  "name": "Mango Smoothie",
  "loyalty_points_earn": 10,
  "loyalty_points_cost": 100
}
```

#### `DELETE /api/loyalty/:id`
Remove a product from loyalty rewards by setting `loyalty_points_cost` to `0`.

**Response:**
```json
{ "success": true }
```

---

## Shop Frontend Integration

The following describes what your **customer-facing shop** needs to implement to use the loyalty program end-to-end.

### 1. Display available rewards

Fetch the reward list and show customers what they can redeem:

```ts
const res = await fetch('/api/loyalty')
const { rewards } = await res.json()
// rewards is sorted by loyalty_points_cost ascending
```

Show each reward with its `loyalty_points_cost` so the customer knows how many points they need.

### 2. Show a customer's current points balance

Query `customer_loyalty_points` for the logged-in user:

```ts
const { data } = await supabase
  .from('customer_loyalty_points')
  .select('total_points')
  .eq('customer_id', userId)
  .single()

const balance = data?.total_points ?? 0
```

### 3. Award points after a purchase

After an order is placed, loop over each item in the order and add the `loyalty_points_earn` value to the customer's balance:

```ts
async function awardPointsForOrder(customerId: string, orderItems: OrderItem[]) {
  let pointsEarned = 0

  for (const item of orderItems) {
    // Fetch the product's earn value
    const { data: product } = await supabase
      .from('menu_items')
      .select('loyalty_points_earn')
      .eq('id', item.productId)
      .single()

    if (product && product.loyalty_points_earn > 0) {
      pointsEarned += product.loyalty_points_earn * item.quantity
    }
  }

  if (pointsEarned > 0) {
    // Upsert the customer's balance
    await supabase.rpc('increment_loyalty_points', {
      p_customer_id: customerId,
      p_points: pointsEarned
    })

    // Optional: log the transaction
    await supabase.from('loyalty_transactions').insert({
      customer_id: customerId,
      order_id: orderId,
      points: pointsEarned,
      reason: 'purchase'
    })
  }
}
```

**Supabase RPC helper function (run once in SQL editor):**

```sql
CREATE OR REPLACE FUNCTION increment_loyalty_points(p_customer_id UUID, p_points INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO customer_loyalty_points (customer_id, total_points)
  VALUES (p_customer_id, p_points)
  ON CONFLICT (customer_id)
  DO UPDATE SET
    total_points = customer_loyalty_points.total_points + p_points,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

### 4. Redeem a reward

When a customer chooses to redeem a reward product:

1. Check their balance >= `loyalty_points_cost` of the chosen reward.
2. Deduct the points.
3. Add the item to the order at `$0.00`.

```ts
async function redeemReward(customerId: string, rewardProductId: string) {
  // 1. Get reward cost
  const { data: product } = await supabase
    .from('menu_items')
    .select('loyalty_points_cost, name')
    .eq('id', rewardProductId)
    .single()

  if (!product || product.loyalty_points_cost === 0) {
    throw new Error('This product is not a reward')
  }

  // 2. Check customer balance
  const { data: loyaltyRow } = await supabase
    .from('customer_loyalty_points')
    .select('total_points')
    .eq('customer_id', customerId)
    .single()

  const balance = loyaltyRow?.total_points ?? 0

  if (balance < product.loyalty_points_cost) {
    throw new Error(`Not enough points. You need ${product.loyalty_points_cost}, you have ${balance}.`)
  }

  // 3. Deduct points
  await supabase.rpc('increment_loyalty_points', {
    p_customer_id: customerId,
    p_points: -product.loyalty_points_cost
  })

  // 4. Log redemption
  await supabase.from('loyalty_transactions').insert({
    customer_id: customerId,
    product_id: rewardProductId,
    points: -product.loyalty_points_cost,
    reason: 'redemption'
  })

  // 5. Add item to cart at $0 — implement this in your cart logic
  addToCart({ productId: rewardProductId, price: 0, isRedeemed: true })
}
```

---

## Example Flows

### Flow A — Customer earns points

1. Customer orders a **Mango Smoothie** (`loyalty_points_earn = 10`).
2. Order is confirmed → `+10` points added to their balance.
3. Balance: `10 pts`.

---

### Flow B — Customer redeems a reward

1. Customer has `100 pts`.
2. They visit the **Rewards** section and see "Free Mango Smoothie — 100 pts".
3. They tap **Redeem**.
4. System checks: `100 >= 100` ✓
5. Points deducted: balance becomes `0 pts`.
6. Mango Smoothie added to cart at **$0.00**.
7. Order placed. Customer receives free item.

---

## FAQ

**Q: Can a product both earn points AND be a reward?**  
Yes. Set `loyalty_points_earn > 0` AND `loyalty_points_cost > 0` on the same product. The customer will earn points for purchasing it normally, and can also redeem it once they have enough points.

**Q: What happens if I remove a reward in the dashboard?**  
`loyalty_points_cost` is set to `0`. The product is no longer redeemable. It still keeps its `loyalty_points_earn` value — customers still earn points buying it.

**Q: What happens to a customer's existing points if I change the cost of a reward?**  
Nothing. Points already accumulated are unaffected. Only new redemptions use the updated cost.

**Q: How do I disable the loyalty program entirely?**  
Set `loyalty_points_earn = 0` on all products and `loyalty_points_cost = 0` on all rewards (or just stop showing the rewards section in the shop).

**Q: Can I give customers bonus points manually?**  
Yes — call `increment_loyalty_points(customer_id, bonus_amount)` directly from the Supabase SQL editor or a custom admin action.
