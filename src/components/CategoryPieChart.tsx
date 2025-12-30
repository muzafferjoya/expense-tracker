'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Spending by Category</h3>
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📊</p>
          <p>No expenses to visualize yet</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">
            {payload[0].payload.icon} {payload[0].name}
          </p>
          <p className="text-sm text-gray-600">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500">
            {payload[0].payload.percent}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map(item => ({
    ...item,
    percent: ((item.value / total) * 100).toFixed(1)
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Spending by Category</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${percent}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-700 truncate">
              {item.icon} {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}