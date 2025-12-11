import { format, differenceInYears, differenceInMonths } from 'date-fns';

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';

  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Calculate years and months ago from a date string (DD/MM/YYYY)
 */
export function getYearsAgo(dateStr: string): string {
  if (!dateStr) return '';

  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  if (isNaN(date.getTime())) return '';

  const now = new Date();

  let years = now.getFullYear() - date.getFullYear();
  let months = now.getMonth() - date.getMonth();

  // Adjust if current month is before the birth month
  if (months < 0) {
    years--;
    months += 12;
  }

  // Adjust if day is ahead in the current month
  if (now.getDate() < date.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  // Build output
  if (years > 0 && months > 0) {
    return `${years} years ${months} months`;
  } else if (years > 0) {
    return `${years} years`;
  } else {
    return `${months} months`;
  }
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Format date for display
 */
export function formatDisplayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}
