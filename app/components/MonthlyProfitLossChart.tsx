// app/components/MonthlyProfitLossChart.tsx
"use client";

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Props {
  data: Record<string, number>;
}

const COLORS = { positive: '#22c55e', negative: '#ef4444' };

export default function MonthlyProfitLossChart({ data }: Props) {
  const chartData = useMemo(() => {
    return Object.entries(data)
      .map(([month, profit]) => ({ month, profit }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return null; // データがない場合は何も表示しない
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-8">
      <h3 className="text-xl font-bold text-indigo-700 mb-4">月別 損益</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis 
            tickFormatter={(value) => new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(value)}
          />
          <Tooltip 
            formatter={(value: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value)}
          />
          <Legend />
          <Bar dataKey="profit" name="損益">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? COLORS.positive : COLORS.negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
