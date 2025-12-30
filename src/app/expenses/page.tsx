'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV, exportToJSON, shareExpenses } from '@/lib/export';

interface Expense {
  id: string;
  amount: number;
  note: string | null;
  expense_date: string;
  created_at: string;
  category_id: string | null;
  categories?: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function ExpenseListContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  useEffect(() => {
    loadExpenses();
  }, [month, year]);

  async function loadExpenses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          categories (
            name,
            icon,
            color
          )
        `)
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

  const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  function handleExport(format: 'csv' | 'json' | 'share') {
    const monthName = MONTHS[month - 1];
    
    if (format === 'csv') {
      exportToCSV(expenses, monthName, year);
    } else if (format === 'json') {
      exportToJSON(expenses, monthName, year);
    } else {
      shareExpenses(expenses, monthName, year);
    }
    
    setShowExportMenu(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
            </div>
            
            {expenses.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm px-3 py-2 rounded-lg hover:bg-blue-50"
                >
                  📥 Export
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      📄 Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      📋 Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('share')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      📤 Share Summary
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 ml-11">
            {MONTHS[month - 1]} {year}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Total Summary */}
        {expenses.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white mb-6">
            <p className="text-sm opacity-90 mb-1">Total for {MONTHS[month - 1]}</p>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
            <p className="text-sm opacity-75 mt-2">{expenses.length} expense{expenses.length > 1 ? 's' : ''}</p>
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">💸</div>
            <p className="text-gray-600 mb-2">No expenses for {MONTHS[month - 1]}</p>
            <p className="text-sm text-gray-500 mb-6">Start tracking by adding your first expense</p>
            <button
              onClick={() => router.push('/add-expense')}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  {expense.categories && (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${expense.categories.color}20` }}
                    >
                      {expense.categories.icon}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-900">
                      {formatCurrency(Number(expense.amount))}
                    </p>
                    {expense.categories && (
                      <p className="text-xs text-gray-500">{expense.categories.name}</p>
                    )}
                    {expense.note && (
                      <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>
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

export default function ExpenseList() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ExpenseListContent />
    </Suspense>
  );
}