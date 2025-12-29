'use client';

interface BudgetAlertProps {
  spent: number;
  budget: number;
  remaining: number;
}

export default function BudgetAlert({ spent, budget, remaining }: BudgetAlertProps) {
  const percentage = (spent / budget) * 100;

  // No alert needed if spending is healthy
  if (percentage < 70) return null;

  const getAlertConfig = () => {
    if (percentage >= 100) {
      return {
        icon: '🚨',
        title: 'Budget Exceeded!',
        message: `You've exceeded your budget by ${Math.abs(remaining).toFixed(0)}. Consider reducing expenses.`,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconBg: 'bg-red-100'
      };
    } else if (percentage >= 90) {
      return {
        icon: '⚠️',
        title: 'Budget Alert - 90% Used',
        message: `Only ₹${remaining.toFixed(0)} left for this month. Be careful with spending!`,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconBg: 'bg-orange-100'
      };
    } else {
      return {
        icon: '⚡',
        title: 'Budget Warning - 70% Used',
        message: `You've used ${percentage.toFixed(0)}% of your budget. Track your expenses carefully.`,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconBg: 'bg-amber-100'
      };
    }
  };

  const alert = getAlertConfig();

  return (
    <div className={`${alert.bgColor} border ${alert.borderColor} rounded-xl p-4 mb-6 animate-pulse`}>
      <div className="flex items-start gap-3">
        <div className={`${alert.iconBg} rounded-full p-2 flex-shrink-0`}>
          <span className="text-2xl">{alert.icon}</span>
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${alert.textColor} mb-1`}>
            {alert.title}
          </h3>
          <p className={`text-sm ${alert.textColor}`}>
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}