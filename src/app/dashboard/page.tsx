'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, getHealthColor, getDailyBurnRate } from '@/lib/utils';
import ProgressRing from '@/components/ProgressRing';

interface DashboardData {
  budget: number;
  spent: number;
  remaining: number;
  dailyBurnRate: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get current month's budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      if (budgetError || !budgetData) {
        router.push('/onboarding');
        return;
      }

      // Get current month's expenses
      const firstDay = new Date(currentYear, currentMonth - 1, 1);
      const lastDay = new Date(currentYear, currentMonth, 0);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('expense_date', firstDay.toISOString().split('T')[0])
        .lte('expense_date', lastDay.toISOString().split('T')[0]);

      if (expensesError) throw expensesError;

      const totalSpent = expensesData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const budget = Number(budgetData.amount);
      const remaining = budget - totalSpent;
      
      const today = new Date();
      const daysElapsed = today.getDate();
      const dailyBurnRate = getDailyBurnRate(totalSpent, daysElapsed);

      setData({
        budget,
        spent: totalSpent,
        remaining,
        dailyBurnRate
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

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
        {/* Progress Ring */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <ProgressRing 
            spent={data.spent} 
            budget={data.budget} 
            color={healthColor} 
          />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Monthly Budget</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.budget)}
            </p>
          </div>
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
            onClick={() => router.push('/add-expense')}
            className="flex-1 bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            + Add Expense
          </button>
          <button
            onClick={() => router.push('/expenses')}
            className="flex-1 bg-white text-gray-900 font-semibold py-4 px-6 rounded-xl shadow-sm border border-gray-200 active:scale-95 transition-transform"
          >
            View All
          </button>
        </div>
      </div>
    </div>
  );
}