# Coffee Shop Admin Dashboard

A modern, full-featured admin dashboard for managing your coffee shop's products, categories, and orders.

## 🚀 Features

### ✅ Products Management
- **Create** new products with full details
- **View** products in grid or table layout
- **Edit** product information
- **Delete** products with confirmation
- **Search** and filter by category
- **Toggle** availability and featured status
- Real-time sync with Coffee Shop website

### ✅ Categories Management
- **Create** parent categories and subcategories
- **View** hierarchical category structure
- **Edit** category details
- **Delete** categories with confirmation
- Expand/collapse subcategories
- Active/inactive status management

### ✅ Orders Management
- **View** all customer orders
- **Search** by order number or customer
- **Filter** by order status
- **Update** order status
- **Delete** orders with confirmation
- Real-time updates every 30 seconds

### ✅ Dashboard Overview
- Total products count
- Total orders count
- Total revenue
- Pending orders count
- Recent orders list
- Order status distribution

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Notifications**: Sonner

## 📦 Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Create `.env.local` file**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run development server**:
```bash
npm run dev
```

4. **Open dashboard**:
```
http://localhost:3001
```

## 🗄️ Database Setup

The dashboard uses the same Supabase database as the Coffee Shop website.

**Run the setup script** in Supabase SQL Editor:
```
../scripts/05-complete-setup.sql
```

This creates all necessary tables and permissions.

## 📁 Project Structure

```
admin-dashboard/
├── app/
│   ├── (dashboard)/          # Dashboard pages
│   │   ├── products/          # Products CRUD
│   │   ├── categories/        # Categories CRUD
│   │   ├── orders/            # Orders management
│   │   └── page.tsx           # Dashboard home
│   └── api/                   # API routes
│       ├── products/          # Products API
│       ├── categories/        # Categories API
│       └── orders/            # Orders API
├── components/
│   ├── products/              # Product components
│   ├── categories/            # Category components
│   ├── orders/                # Order components
│   ├── dashboard/             # Dashboard widgets
│   └── ui/                    # Reusable UI components
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── database.ts            # Database services
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Utility functions
└── public/                    # Static assets
```

## 🎯 Usage

### Adding a Product

1. Navigate to **Products** page
2. Click **"Add Product"** button
3. Fill in the form:
   - Name (required)
   - Description
   - Price (required)
   - Category (required)
   - Image URL
   - Availability
   - Featured status
4. Click **"Create Product"**
5. Product appears immediately on Coffee Shop website

### Managing Categories

1. Navigate to **Categories** page
2. Click **"Add Category"** button
3. Fill in:
   - Name (required)
   - Description (optional)
   - Parent Category (optional)
   - Active status
4. Click **"Create Category"**
5. Category available for product assignment

### Managing Orders

1. Navigate to **Orders** page
2. View all customer orders
3. Search or filter as needed
4. Click on order to view details
5. Update status as order progresses
6. Delete if necessary

## 🔄 Data Sync

The dashboard is **fully synchronized** with the Coffee Shop website:

- Products added → Appear on website immediately
- Products edited → Changes reflect in real-time
- Products deleted → Removed from website
- Categories managed → Available for filtering
- Orders created → Show up in dashboard

## 🎨 UI/UX Features

- **Responsive Design**: Works on all devices
- **Dark Mode Ready**: Theme support built-in
- **Smooth Animations**: Framer Motion transitions
- **Loading States**: Clear feedback during operations
- **Error Handling**: User-friendly error messages
- **Confirmation Dialogs**: Prevent accidental deletions
- **Toast Notifications**: Success/error feedback
- **Tooltips**: Helpful hints on hover
- **Auto-refresh**: Real-time data updates

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **Authenticated access** required for write operations
- **Input validation** on client and server
- **SQL injection protection** via Supabase
- **XSS protection** via React
- **CSRF protection** via Next.js

## 📊 API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `GET /api/categories/[id]` - Get category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/[id]` - Get order
- `PUT /api/orders/[id]` - Update order
- `DELETE /api/orders/[id]` - Delete order

## 🐛 Troubleshooting

### Products not showing?
- Check Supabase connection
- Verify RLS policies
- Check browser console for errors
- Ensure categories exist

### Can't create products?
- Verify `.env.local` exists
- Check Supabase credentials
- Ensure categories are created first
- Check API route logs

### Orders not loading?
- Verify database connection
- Check if orders exist in database
- Look for console errors
- Refresh the page

## 📚 Documentation

- [Admin Dashboard Features](./ADMIN_DASHBOARD_FEATURES.md) - Complete CRUD operations guide
- [Setup Guide](../SETUP_GUIDE.md) - Initial setup instructions
- [Integration Guide](../README_INTEGRATION.md) - Coffee Shop integration

## 🤝 Contributing

This is a private project, but improvements are welcome:

1. Test thoroughly
2. Follow existing code style
3. Update documentation
4. Add comments for complex logic

## 📄 License

Private project - All rights reserved

---

**Built with ☕ for Coffee Shop Management**
