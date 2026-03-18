export function calculateDaysRemaining(endDate: Date | string): number {
  if (!endDate) return 0;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  
  // Reset time to strictly compare dates
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isExpired(endDate: Date | string): boolean {
  return calculateDaysRemaining(endDate) < 0;
}

export function isNearExpiry(endDate: Date | string, thresholdDays = 30): boolean {
  const days = calculateDaysRemaining(endDate);
  return days >= 0 && days <= thresholdDays;
}

export function formatDateBR(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}
