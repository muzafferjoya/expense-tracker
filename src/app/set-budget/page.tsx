'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function SetBudgetContent() {
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  useEffect(() => {
    loadExistingBudget();
  }, []);

  async function loadExistingBudget() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .single();

      if (budgetData) {
        setBudget(budgetData.amount.toString());
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!budget || Number(budget) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Check if budget already exists
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .single();

      if (existing) {
        // Update existing budget
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ amount: Number(budget) })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new budget
        const { error: insertError } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            amount: Number(budget),
            month: month,
            year: year
          });

        if (insertError) throw insertError;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to set budget');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Budget
          </h1>
          <p className="text-gray-600">
            {MONTHS[month - 1]} {year}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Budget
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl text-gray-700">
                ₹
              </span>
              <input
                id="budget"
                type="number"
                step="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="25,000"
                className="w-full pl-16 pr-6 py-6 text-4xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-center"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-xl active:scale-95 transition-transform"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            💡 Set different budgets for each month based on your needs
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetBudget() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <SetBudgetContent />
    </Suspense>
  );
}