"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const categoryData = [
  { category: "Meal Replacement", sales: 1240, orders: 45 },
  { category: "Loaded Tea", sales: 1890, orders: 78 },
  { category: "Beauty Drinks", sales: 980, orders: 32 },
  { category: "Specialty Drinks", sales: 1560, orders: 58 },
  { category: "Kids Drinks", sales: 420, orders: 28 },
  { category: "Chai Latte", sales: 680, orders: 35 },
  { category: "Protein Waffles", sales: 1120, orders: 42 },
]

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-2))",
  },
} satisfies Record<string, { label: string; color: string }>

export function CategorySalesChart() {
  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Sales by Category</CardTitle>
        <CardDescription>Revenue breakdown by product category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={categoryData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar
              dataKey="sales"
              fill="var(--color-sales)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
