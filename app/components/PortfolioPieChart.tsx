"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PortfolioItem } from "@/type";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

export default function PortfolioPieChart({ data }: { data: PortfolioItem[] }) {
  if (!Array.isArray(data)) {
    console.error("PortfolioPieChart に配列以外の data が渡されました:", data);
    return <p>データがありません</p>;
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const total = sortedData.reduce((acc, item) => acc + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={sortedData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={150}
          label={false}
          startAngle={90}
          endAngle={-270}
        >
          {sortedData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number, _, props: any) => {
            const percent = ((value / total) * 100).toFixed(1);
            return [`${value.toLocaleString()}円 (${percent}%)`, props.payload.name];
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          content={() => (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {sortedData.map((item, index) => {
                const percent = ((item.value / total) * 100).toFixed(1);
                const truncatedName = item.name.length > 20 ? `${item.name.substring(0, 18)}...` : item.name;
                return (
                  <li
                    key={`item-${index}`}
                    style={{
                      color: COLORS[index % COLORS.length],
                      marginBottom: 4,
                    }}
                    title={item.name} // ホバー時にフルネームを表示
                  >
                    {truncatedName} ({percent}%)
                  </li>
                );
              })}
            </ul>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}