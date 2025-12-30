'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DaySpending {
  day: number;
  amount: number;
  date: string;
}

interface SpendingTrendChartProps {
  data: DaySpending[];
  month: string;
}

export default function SpendingTrendChart({ data, month }: SpendingTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Spending Trend</h3>
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📈</p>
          <p>No daily data available</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">{payload[0].payload.date}</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Daily Spending Trend</h3>
      <p className="text-sm text-gray-600 mb-4">{month}</p>
      
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            stroke="#888"
            tick={{ fontSize: 12 }}
            label={{ value: 'Day of Month', position: 'insideBottom', offset: -5, fontSize: 12 }}
          />
          <YAxis 
            stroke="#888"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-600">Highest Day</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(maxAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Days with Expenses</p>
          <p className="text-sm font-semibold text-gray-900">
            {data.filter(d => d.amount > 0).length}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Average/Day</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(data.reduce((sum, d) => sum + d.amount, 0) / data.length)}
          </p>
        </div>
      </div>
    </div>
  );
}