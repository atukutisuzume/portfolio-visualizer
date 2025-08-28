// app/components/ProfitLossCalendarTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { fetchDailyChanges, DailyData } from '@/lib/api';

const ProfitLossCalendarTab = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDailyChanges();
        setDailyData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="border p-2 h-28"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const data = dailyData[dateStr];
      let textColor = 'text-gray-500';
      if (data?.change > 0) textColor = 'text-green-600';
      if (data?.change < 0) textColor = 'text-red-600';

      days.push(
        <div key={day} className="border p-2 h-28 flex flex-col justify-center items-center">
          <div className="font-bold text-3xl">{day}</div>
          {data && (
            <div className={`font-semibold text-2xl mt-1 ${textColor}`}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div className="text-red-500">エラー: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="px-4 py-2 bg-gray-200 rounded-md">‹</button>
        <h2 className="text-xl font-bold">
          {currentDate.getFullYear()}年 {currentDate.toLocaleString('default', { month: 'long' })}
        </h2>
        <button onClick={handleNextMonth} className="px-4 py-2 bg-gray-200 rounded-md">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className="font-semibold p-2">{day}</div>
        ))}
        {renderCalendar()}
      </div>
    </div>
  );
};

export default ProfitLossCalendarTab;