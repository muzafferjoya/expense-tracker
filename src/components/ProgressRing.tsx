// components/ProgressRing.tsx
'use client';

interface ProgressRingProps {
  spent: number;
  budget: number;
  color: 'red' | 'amber' | 'green';
}

export default function ProgressRing({ spent, budget, color }: ProgressRingProps) {
  const percentage = Math.min((spent / budget) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    red: 'stroke-red-500',
    amber: 'stroke-amber-500',
    green: 'stroke-green-500'
  };

  const bgColorMap = {
    red: 'text-red-50',
    amber: 'text-amber-50',
    green: 'text-green-50'
  };

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="transform -rotate-90 w-48 h-48">
        <circle
          cx="96"
          cy="96"
          r="54"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className={bgColorMap[color]}
        />
        <circle
          cx="96"
          cy="96"
          r="54"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${colorMap[color]} transition-all duration-500`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">
          {percentage.toFixed(0)}%
        </span>
        <span className="text-sm text-gray-600 mt-1">Spent</span>
      </div>
    </div>
  );
}