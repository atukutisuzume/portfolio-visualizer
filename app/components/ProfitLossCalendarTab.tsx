// app/components/ProfitLossCalendarTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { fetchDailyChanges, DailyData } from '@/lib/api';

const ProfitLossCalendarTab = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});
  const [monthlyChange, setMonthlyChange] = useState<number | null>(null);
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

  useEffect(() => {
    if (Object.keys(dailyData).length === 0) return;

    const calculateMonthlyChange = () => {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const dates = Object.keys(dailyData);

      const lastDayOfCurrentMonth = dates
        .filter(date => new Date(date).getFullYear() === currentYear && new Date(date).getMonth() === currentMonth)
        .sort()
        .pop();

      const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth();

      const lastDayOfPrevMonth = dates
        .filter(date => new Date(date).getFullYear() === prevMonthYear && new Date(date).getMonth() === prevMonth)
        .sort()
        .pop();

      if (lastDayOfCurrentMonth && lastDayOfPrevMonth) {
        const currentTotalValue = dailyData[lastDayOfCurrentMonth]?.totalAsset;
        const prevTotalValue = dailyData[lastDayOfPrevMonth]?.totalAsset;

        if (typeof currentTotalValue === 'number' && typeof prevTotalValue === 'number' && prevTotalValue !== 0) {
          const change = ((currentTotalValue / prevTotalValue) - 1) * 100;
          setMonthlyChange(change);
        } else {
          setMonthlyChange(null);
        }
      } else {
        setMonthlyChange(null);
      }
    };

    calculateMonthlyChange();
  }, [dailyData, currentDate]);

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

    const allCells = [];
    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      allCells.push(<div key={`empty-${i}`} className="p-1 h-24"></div>);
    }

    // Cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const data = dailyData[dateStr];
      let textColor = 'text-gray-400'; // Slightly lighter gray for 0%
      if (data?.change > 0) textColor = 'text-green-500'; // Lighter green
      if (data?.change < 0) textColor = 'text-red-500'; // Lighter red

      allCells.push(
        <div key={day} className="p-1 h-24 flex flex-col justify-center items-center">
          <div className="font-bold text-2xl text-gray-700">{day}</div>
          {data && (
            <div className={`font-semibold text-xl mt-1 ${textColor}`}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
            </div>
          )}
        </div>
      );
    }

    // Group cells into weeks
    const weeks = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weeks.push(allCells.slice(i, i + 7));
    }

    return (
      <div>
        {weeks.map((week, index) => (
          <div key={index} className="grid grid-cols-7 border-b border-gray-200">
            {week.map((day, dayIndex) => (
              <div key={dayIndex} className="flex-1">
                {day}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div className="text-red-500">エラー: {error}</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-3">
        <button onClick={handlePrevMonth} className="px-3 py-1 bg-gray-200 rounded-md text-sm">‹</button>
        <div className="text-center">
          <h2 className="text-lg font-bold">
            {currentDate.getFullYear()}年 {currentDate.toLocaleString('default', { month: 'long' })}
          </h2>
          {monthlyChange !== null && (
            <div className={`text-sm font-semibold ${monthlyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              前月比: {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(2)}%
            </div>
          )}
        </div>
        <button onClick={handleNextMonth} className="px-3 py-1 bg-gray-200 rounded-md text-sm">›</button>
      </div>
      <div className="border-t border-gray-200">
        <div className="grid grid-cols-7 text-center border-b border-gray-200">
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className="font-semibold p-1 text-sm">{day}</div>
          ))}
        </div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default ProfitLossCalendarTab;
