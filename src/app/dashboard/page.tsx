'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, getHealthColor, getDailyBurnRate } from '@/lib/utils';
import ProgressRing from '@/components/ProgressRing';
import BudgetAlert from '@/components/BudgetAlert';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import CategoryPieChart from '@/components/CategoryPieChart';
import SpendingTrendChart from '@/components/SpendingTrendChart';
import SpendingInsights from '@/components/SpendingInsights';

interface DashboardData {
  budget: number;
  spent: number;
  remaining: number;
  dailyBurnRate: number;
}

interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

interface DaySpending {
  day: number;
  amount: number;
  date: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [dailySpending, setDailySpending] = useState<DaySpending[]>([]);
  const router = useRouter();

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Get selected month's budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .single();

      if (budgetError || !budgetData) {
        // No budget for this month
        setData({
          budget: 0,
          spent: 0,
          remaining: 0,
          dailyBurnRate: 0
        });
        // Still load yearly total even if no budget
        await loadYearlyTotal(user.id, selectedYear);
        setLoading(false);
        return;
      }

      // Get selected month's expenses
      const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
      const lastDay = new Date(selectedYear, selectedMonth, 0);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          amount,
          expense_date,
          category_id,
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        .gte('expense_date', firstDay.toISOString().split('T')[0])
        .lte('expense_date', lastDay.toISOString().split('T')[0])
        .order('expense_date', { ascending: true });

      if (expensesError) throw expensesError;

      const totalSpent = expensesData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      
      // Calculate category-wise spending
      const categoryMap = new Map<string, CategorySpending>();
      expensesData?.forEach((expense: any) => {
        if (expense.categories) {
          const catId = expense.category_id;
          const existing = categoryMap.get(catId);
          
          if (existing) {
            existing.total += Number(expense.amount);
          } else {
            categoryMap.set(catId, {
              categoryId: catId,
              categoryName: expense.categories.name,
              categoryIcon: expense.categories.icon,
              categoryColor: expense.categories.color,
              total: Number(expense.amount),
              percentage: 0
            });
          }
        }
      });

      // Calculate percentages and sort by amount
      const categoryArray = Array.from(categoryMap.values())
        .map(cat => ({
          ...cat,
          percentage: (cat.total / totalSpent) * 100
        }))
        .sort((a, b) => b.total - a.total);

      setCategorySpending(categoryArray);

      // Calculate daily spending for line chart
      const daysInMonth = lastDay.getDate();
      const dailyMap = new Map<number, number>();
      
      expensesData?.forEach((expense: any) => {
        const day = new Date(expense.expense_date).getDate();
        dailyMap.set(day, (dailyMap.get(day) || 0) + Number(expense.amount));
      });

      const dailyArray: DaySpending[] = [];
      for (let i = 1; i <= daysInMonth; i++) {
        dailyArray.push({
          day: i,
          amount: dailyMap.get(i) || 0,
          date: new Date(selectedYear, selectedMonth - 1, i).toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short' 
          })
        });
      }
      
      setDailySpending(dailyArray);
      const budget = Number(budgetData.amount);
      const remaining = budget - totalSpent;
      
      // Calculate daily burn rate based on current date if it's current month
      const today = new Date();
      const isCurrentMonth = selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
      const daysElapsed = isCurrentMonth ? today.getDate() : lastDay.getDate();
      const dailyBurnRate = getDailyBurnRate(totalSpent, daysElapsed);

      setData({
        budget,
        spent: totalSpent,
        remaining,
        dailyBurnRate
      });

      // Calculate yearly total for selected year - pass year as parameter
      await loadYearlyTotal(user.id, selectedYear);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadYearlyTotal(userId: string, year: number) {
    try {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const { data: yearlyExpenses, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .gte('expense_date', yearStart)
        .lte('expense_date', yearEnd);

      if (error) throw error;

      const total = yearlyExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      setYearlyTotal(total);
    } catch (error) {
      console.error('Error loading yearly total:', error);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  function handleSetBudget() {
    router.push(`/set-budget?month=${selectedMonth}&year=${selectedYear}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.budget === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
            <button onClick={handleSignOut} className="text-sm text-gray-600 hover:text-gray-900">
              Sign Out
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            >
              {MONTHS.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month} {selectedYear}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-900 font-semibold text-xl mb-2">
              No budget set for {MONTHS[selectedMonth - 1]}
            </p>
            <p className="text-gray-600 mb-6">Set a monthly budget to start tracking</p>
            <button
              onClick={handleSetBudget}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Set Budget for {MONTHS[selectedMonth - 1]}
            </button>
          </div>

          {yearlyTotal > 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
              <p className="text-sm opacity-90 mb-1">Total Expenses in {selectedYear}</p>
              <p className="text-3xl font-bold">{formatCurrency(yearlyTotal)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const healthColor = getHealthColor(data.spent, data.budget);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Month Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
          >
            {MONTHS.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Alert */}
        <BudgetAlert spent={data.spent} budget={data.budget} remaining={data.remaining} />

        {/* Smart Insights */}
        <SpendingInsights
          totalSpent={data.spent}
          budget={data.budget}
          topCategory={categorySpending[0] ? {
            name: categorySpending[0].categoryName,
            amount: categorySpending[0].total,
            icon: categorySpending[0].categoryIcon
          } : undefined}
          daysRemaining={new Date(selectedYear, selectedMonth, 0).getDate() - new Date().getDate()}
          avgDailySpend={data.dailyBurnRate}
        />

        {/* Pie Chart */}
        <CategoryPieChart 
          data={categorySpending.map(cat => ({
            name: cat.categoryName,
            value: cat.total,
            color: cat.categoryColor,
            icon: cat.categoryIcon
          }))}
        />

        {/* Line Chart */}
        <SpendingTrendChart 
          data={dailySpending}
          month={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
        />

        {/* Category Breakdown */}
        <CategoryBreakdown spending={categorySpending} totalBudget={data.budget} />

        {/* Progress Ring */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <ProgressRing 
            spent={data.spent} 
            budget={data.budget} 
            color={healthColor} 
          />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-1">
              Monthly Budget - {MONTHS[selectedMonth - 1]}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.budget)}
            </p>
          </div>
        </div>

        {/* Yearly Summary */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white mb-6">
          <p className="text-sm opacity-90 mb-1">Total Expenses in {selectedYear}</p>
          <p className="text-3xl font-bold">{formatCurrency(yearlyTotal)}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-600 mb-1">Total Spent</p>
            <p className={`text-xl font-bold ${
              healthColor === 'red' ? 'text-red-600' :
              healthColor === 'amber' ? 'text-amber-600' :
              'text-green-600'
            }`}>
              {formatCurrency(data.spent)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-600 mb-1">Remaining</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(data.remaining)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 col-span-2">
            <p className="text-xs text-gray-600 mb-1">Daily Burn Rate</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(data.dailyBurnRate)}/day
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/add-expense?month=${selectedMonth}&year=${selectedYear}`)}
            className="flex-1 bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            + Add Expense
          </button>
          <button
            onClick={() => router.push(`/expenses?month=${selectedMonth}&year=${selectedYear}`)}
            className="flex-1 bg-white text-gray-900 font-semibold py-4 px-6 rounded-xl shadow-sm border border-gray-200 active:scale-95 transition-transform"
          >
            View All
          </button>
        </div>

        <button
          onClick={handleSetBudget}
          className="w-full mt-3 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl active:scale-95 transition-transform"
        >
          Update Budget
        </button>
      </div>
    </div>
  );
}