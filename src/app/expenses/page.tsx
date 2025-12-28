'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Expense {
  id: string;
  amount: number;
  note: string | null;
  expense_date: string;
  created_at: string;
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const firstDay = new Date(currentYear, currentMonth - 1, 1);
      const lastDay = new Date(currentYear, currentMonth, 0);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', firstDay.toISOString().split('T')[0])
        .lte('expense_date', lastDay.toISOString().split('T')[0])
        .order('expense_date', { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(expenses.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Monthly Expenses</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {expenses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">💸</div>
            <p className="text-gray-600 mb-6">No expenses yet this month</p>
            <button
              onClick={() => router.push('/add-expense')}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Add Your First Expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-lg text-gray-900">
                    {formatCurrency(Number(expense.amount))}
                  </p>
                  {expense.note && (
                    <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="ml-4 text-red-600 hover:text-red-700 font-medium text-sm px-3 py-2 rounded-lg hover:bg-red-50 active:scale-95 transition-transform"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}