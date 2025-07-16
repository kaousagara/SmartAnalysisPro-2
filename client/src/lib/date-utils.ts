/**
 * Utility functions for safe date formatting and handling
 */

/**
 * Safely format a date string to a localized date string
 * @param dateString - The date string to format
 * @param locale - The locale to use for formatting (default: 'fr-FR')
 * @param fallback - The fallback string if date is invalid (default: 'Date inconnue')
 * @returns Formatted date string or fallback
 */
export function safeFormatDate(
  dateString: string | null | undefined,
  locale: string = 'fr-FR',
  fallback: string = 'Date inconnue'
): string {
  try {
    if (!dateString) return fallback;
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    return date.toLocaleDateString(locale);
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Date invalide';
  }
}

/**
 * Safely format a date string to a localized date and time string
 * @param dateString - The date string to format
 * @param locale - The locale to use for formatting (default: 'fr-FR')
 * @param fallback - The fallback string if date is invalid (default: 'Date inconnue')
 * @returns Formatted date and time string or fallback
 */
export function safeFormatDateTime(
  dateString: string | null | undefined,
  locale: string = 'fr-FR',
  fallback: string = 'Date inconnue'
): string {
  try {
    if (!dateString) return fallback;
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    return date.toLocaleString(locale);
  } catch (error) {
    console.error('Error formatting date time:', error, dateString);
    return 'Date invalide';
  }
}

/**
 * Safely format a date string to a "time ago" format
 * @param dateString - The date string to format
 * @param fallback - The fallback string if date is invalid (default: 'Date inconnue')
 * @returns Time ago string or fallback
 */
export function safeFormatTimeAgo(
  dateString: string | null | undefined,
  fallback: string = 'Date inconnue'
): string {
  try {
    if (!dateString) return fallback;
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  } catch (error) {
    console.error('Error formatting time ago:', error, dateString);
    return 'Date invalide';
  }
}

/**
 * Safely create a Date object from a string
 * @param dateString - The date string to parse
 * @returns Date object or null if invalid
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  try {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', error, dateString);
    return null;
  }
}