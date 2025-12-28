export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getHealthColor(spent: number, budget: number): 'red' | 'amber' | 'green' {
  const percentage = (spent / budget) * 100;
  if (percentage >= 90) return 'red';
  if (percentage >= 70) return 'amber';
  return 'green';
}

export function getDailyBurnRate(spent: number, daysElapsed: number): number {
  return daysElapsed > 0 ? spent / daysElapsed : 0;
}
