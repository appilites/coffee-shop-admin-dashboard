"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { mockOrders } from "@/data/mock-data"
import { Pie, PieChart, Cell, Legend } from "recharts"

const getStatusData = () => {
  const statuses = [
    { status: "PENDING", count: mockOrders.filter((o) => o.status === "PENDING").length, colorKey: "chart-5" },
    { status: "CONFIRMED", count: mockOrders.filter((o) => o.status === "CONFIRMED").length, colorKey: "chart-3" },
    { status: "PREPARING", count: mockOrders.filter((o) => o.status === "PREPARING").length, colorKey: "chart-4" },
    { status: "READY", count: mockOrders.filter((o) => o.status === "READY").length, colorKey: "chart-2" },
    { status: "COMPLETED", count: mockOrders.filter((o) => o.status === "COMPLETED").length, colorKey: "chart-2" },
    { status: "CANCELLED", count: mockOrders.filter((o) => o.status === "CANCELLED").length, colorKey: "destructive" },
  ]
  return statuses.filter((item) => item.count > 0)
}

const chartConfig = {
  count: {
    label: "Orders",
  },
} satisfies Record<string, { label: string }>

export function OrderStatusChart() {
  const statusCounts = getStatusData()
  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Order Status Distribution</CardTitle>
        <CardDescription>Breakdown of orders by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Pie
              data={statusCounts}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={false}
            >
              {statusCounts.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`hsl(var(--${entry.colorKey}))`}
                />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => {
                const entry = statusCounts.find((s) => s.status === value)
                if (entry) {
                  // Capitalize first letter only
                  const formattedStatus = value.charAt(0) + value.slice(1).toLowerCase()
                  return `${formattedStatus}: ${entry.count}`
                }
                return value
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
