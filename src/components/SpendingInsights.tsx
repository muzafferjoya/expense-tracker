'use client';

import { formatCurrency } from '@/lib/utils';

interface Insight {
  icon: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
}

interface SpendingInsightsProps {
  totalSpent: number;
  budget: number;
  topCategory?: {
    name: string;
    amount: number;
    icon: string;
  };
  daysRemaining: number;
  avgDailySpend: number;
}

export default function SpendingInsights({
  totalSpent,
  budget,
  topCategory,
  daysRemaining,
  avgDailySpend
}: SpendingInsightsProps) {
  const insights: Insight[] = [];

  const remaining = budget - totalSpent;
  const remainingPerDay = daysRemaining > 0 ? remaining / daysRemaining : 0;
  const percentSpent = (totalSpent / budget) * 100;

  // Top spending category insight
  if (topCategory && topCategory.amount > 0) {
    const categoryPercent = (topCategory.amount / totalSpent) * 100;
    insights.push({
      icon: topCategory.icon,
      title: `Top Spending: ${topCategory.name}`,
      description: `You spent ${formatCurrency(topCategory.amount)} (${categoryPercent.toFixed(0)}% of total) on ${topCategory.name}`,
      type: 'info'
    });
  }

  // Budget pace insight
  if (percentSpent < 70) {
    insights.push({
      icon: '🎯',
      title: 'Great Job!',
      description: `You're on track with only ${percentSpent.toFixed(0)}% of budget used. Keep it up!`,
      type: 'success'
    });
  } else if (percentSpent >= 70 && percentSpent < 90) {
    insights.push({
      icon: '⚡',
      title: 'Watch Your Spending',
      description: `You can spend ${formatCurrency(remainingPerDay)}/day for the rest of the month`,
      type: 'warning'
    });
  } else if (percentSpent >= 90 && percentSpent < 100) {
    insights.push({
      icon: '⚠️',
      title: 'Almost at Budget Limit',
      description: `Only ${formatCurrency(remaining)} left. Try to minimize expenses!`,
      type: 'warning'
    });
  } else {
    insights.push({
      icon: '🚨',
      title: 'Budget Exceeded',
      description: `You've exceeded your budget by ${formatCurrency(Math.abs(remaining))}`,
      type: 'warning'
    });
  }

  // Daily spending insight
  if (avgDailySpend > 0) {
    const projectedTotal = avgDailySpend * 30;
    if (projectedTotal > budget) {
      insights.push({
        icon: '📊',
        title: 'Spending Projection',
        description: `At current rate (${formatCurrency(avgDailySpend)}/day), you'll exceed budget by ${formatCurrency(projectedTotal - budget)}`,
        type: 'warning'
      });
    } else {
      insights.push({
        icon: '✨',
        title: 'Projected Savings',
        description: `At current rate, you'll save ${formatCurrency(budget - projectedTotal)} this month!`,
        type: 'success'
      });
    }
  }

  if (insights.length === 0) return null;

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Smart Insights</h3>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${getColorClasses(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <h4 className="font-semibold mb-1">{insight.title}</h4>
                <p className="text-sm">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}