import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DayRecord } from '../types';

interface SummaryChartProps {
  days: DayRecord[];
  isDark: boolean;
  period: 'daily' | 'weekly' | 'monthly';
  setPeriod: (period: 'daily' | 'weekly' | 'monthly') => void;
}

// Helper to get week number
const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

const SummaryChart: React.FC<SummaryChartProps> = ({ days, isDark, period, setPeriod }) => {
  
  const processedData = useMemo(() => {
    // 1. Sort chronological
    const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

    if (period === 'daily') {
      // Logic for daily (existing) - Show max last 14 days if not filtered to avoid overcrowding
      // If user is filtering via date range, we show what they asked for.
      return sortedDays.map(day => {
        const dateObj = new Date(day.date + 'T00:00:00');
        return {
          label: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`,
          fullDate: day.date,
          veiculos: day.records.length,
          notas: day.records.reduce((acc, curr) => acc + curr.invoiceCount, 0)
        };
      });
    } 
    
    if (period === 'weekly') {
      // Logic for weekly grouping
      const groups: Record<string, { label: string, veiculos: number, notas: number, sortKey: string }> = {};

      sortedDays.forEach(day => {
        const dateObj = new Date(day.date + 'T00:00:00');
        const weekNum = getWeekNumber(dateObj);
        const year = dateObj.getFullYear();
        const key = `${year}-W${weekNum}`;
        
        if (!groups[key]) {
          groups[key] = {
            label: `Sem ${weekNum}`,
            sortKey: key,
            veiculos: 0,
            notas: 0
          };
        }
        
        groups[key].veiculos += day.records.length;
        groups[key].notas += day.records.reduce((acc, curr) => acc + curr.invoiceCount, 0);
      });

      return Object.values(groups).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }

    if (period === 'monthly') {
      // Logic for monthly grouping
      const groups: Record<string, { label: string, veiculos: number, notas: number, sortKey: string }> = {};
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      sortedDays.forEach(day => {
        const dateObj = new Date(day.date + 'T00:00:00');
        const monthIndex = dateObj.getMonth();
        const year = dateObj.getFullYear();
        const key = `${year}-${monthIndex}`; // 2023-0 for Jan

        if (!groups[key]) {
          groups[key] = {
            label: `${months[monthIndex]}/${year.toString().slice(2)}`,
            sortKey: `${year}-${String(monthIndex).padStart(2, '0')}`,
            veiculos: 0,
            notas: 0
          };
        }

        groups[key].veiculos += day.records.length;
        groups[key].notas += day.records.reduce((acc, curr) => acc + curr.invoiceCount, 0);
      });

      return Object.values(groups).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }

    return [];
  }, [days, period]);

  // UI Config for Buttons
  const buttons = [
    { id: 'daily', label: 'Diário' },
    { id: 'weekly', label: 'Semanal' },
    { id: 'monthly', label: 'Mensal' },
  ] as const;

  return (
    <div className="w-full bg-white dark:bg-carddark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Análise de Produtividade
        </h3>
        
        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
          {buttons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                period === btn.id
                  ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-100 dark:border-gray-700/50 rounded-lg">
          <p className="text-gray-400 dark:text-gray-500 font-medium">Nenhum dado para exibir neste período.</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: isDark ? '#374151' : '#f3f4f6', opacity: 0.4 }}
                contentStyle={{ 
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  color: isDark ? '#f3f4f6' : '#1f2937',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar 
                dataKey="veiculos" 
                name="Veículos" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
              <Bar 
                dataKey="notas" 
                name="Notas Fiscais" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SummaryChart;