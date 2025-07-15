// src/components/PortfolioPieChart.tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { PortfolioData } from "@/types";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

export default function PortfolioPieChart({ data }: { data: PortfolioData[] }) {
  console.log(data)
  return (
    <PieChart width={400} height={400}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={150}
        fill="#8884d8"
        label
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => `${value.toLocaleString()}円`} />
      <Legend />
    </PieChart>
  );
}
