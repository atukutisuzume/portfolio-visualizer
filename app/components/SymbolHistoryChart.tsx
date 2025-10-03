
// app/components/SymbolHistoryChart.tsx
"use client";

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface HistoryData {
  date: string;
  quantity: number;
  holdingRate: number;
}

interface Props {
  data: HistoryData[];
  symbol: string;
}

export default function SymbolHistoryChart({ data, symbol }: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow h-full">
      <h3 className="text-xl font-bold text-indigo-700 mb-4">銘柄推移: {symbol}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
          />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: '保有株数', angle: -90, position: 'insideLeft' }} />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#82ca9d" 
            label={{ value: '保有率 (%)', angle: 90, position: 'insideRight' }}
            tickFormatter={(value) => (value * 100).toFixed(1)}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === '保有率') {
                return `${(Number(value) * 100).toFixed(2)} %`;
              }
              if (name === '保有株数') {
                return `${Number(value).toLocaleString()} 株`;
              }
              return value;
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="quantity" name="保有株数" fill="#e0e0e0" />
          <Line yAxisId="right" type="monotone" dataKey="holdingRate" name="保有率" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
