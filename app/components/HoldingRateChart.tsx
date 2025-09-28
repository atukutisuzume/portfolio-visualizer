// app/components/HoldingRateChart.tsx
"use client";

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyCompositionData } from '@/lib/api';

interface Props {
  data: MonthlyCompositionData[];
  isLoading: boolean;
  error: string | null;
}

// HSLカラーを生成するシンプルな関数
const generateColor = (index: number, total: number) => {
  const hue = (index * (360 / total)) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

export default function HoldingRateChart({ data, isLoading, error }: Props) {
  const { chartData, keys } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], keys: [] };
    }

    const allKeys = new Set<string>();
    data.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date') {
          allKeys.add(key);
        }
      });
    });

    const sortedKeys = Array.from(allKeys).sort();

    const processedData = data.map(day => {
      const totalValue = sortedKeys.reduce((acc, key) => acc + (Number(day[key]) || 0), 0);
      const percentages: { [key: string]: number } = {};
      
      if (totalValue > 0) {
        for (const key of sortedKeys) {
          percentages[key] = ((Number(day[key]) || 0) / totalValue) * 100;
        }
      }

      return {
        date: new Date(day.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
        ...percentages,
      };
    });

    return { chartData: processedData, keys: sortedKeys };
  }, [data]);

  if (isLoading) {
    return <div className="text-center p-4">グラフを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">エラー: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center p-4">グラフのデータがありません。</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h3 className="text-xl font-bold text-indigo-700 mb-4">保有率 推移</h3>
        <ResponsiveContainer width="100%" height={400}>
            <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                    tickFormatter={(tick) => `${tick.toFixed(0)}%`}
                    domain={[0, 100]}
                />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Legend />
                {keys.map((key, index) => (
                    <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stackId="1"
                        stroke={generateColor(index, keys.length)}
                        fill={generateColor(index, keys.length)}
                        name={key}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
}
