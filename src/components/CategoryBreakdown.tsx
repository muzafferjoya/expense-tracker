'use client';

import { formatCurrency } from '@/lib/utils';

interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  spending: CategorySpending[];
  totalBudget: number;
}

export default function CategoryBreakdown({ spending, totalBudget }: CategoryBreakdownProps) {
  if (spending.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Category Breakdown</h3>
      
      <div className="space-y-3">
        {spending.map((item) => (
          <div key={item.categoryId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${item.categoryColor}20` }}
                >
                  {item.categoryIcon}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {item.categoryName}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.total)}
                </p>
                <p className="text-xs text-gray-500">
                  {item.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.categoryColor
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}