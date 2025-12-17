// DateUtils.ts (or wherever your utilities are located)

// Define the expected structure of the timestamp object from the API
interface ProtobufTimestamp {
  seconds: string | number;
  nanos: number;
}

/**
 * Converts various date inputs (string, or Protobuf {seconds, nanos} object) 
 * into a readable date and time string.
 * @param {string | ProtobufTimestamp | null | undefined} value - The input date/time value.
 * @param {string} locale - The locale for formatting.
 * @returns {string} The formatted date and time string or a fallback indicator.
 */
export function formatDateTime(
  value?: string | ProtobufTimestamp | null, 
  locale = 'en-US'
): string {
  let date: Date;

  if (!value) {
    return '—';
  }

  try {
    if (typeof value === 'object' && value !== null && 'seconds' in value && 'nanos' in value) {
      // FIX: Case 1: Handle Protobuf Timestamp object {seconds, nanos}
      const seconds = Number(value.seconds);
      const nanos = Number(value.nanos);
      
      // Calculate total milliseconds since epoch
      const milliseconds = seconds * 1000 + nanos / 1000000;
      date = new Date(milliseconds);
    } else if (typeof value === 'string') {
      // Case 2: Handle standard ISO date string
      date = new Date(value);
    } else {
        // Fallback for unexpected types
        return '—';
    }

    // Common formatting logic
    if (Number.isNaN(date.getTime())) {
      return typeof value === 'string' ? value : '—'; 
    }
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use AM/PM format
    }).format(date);

  } catch (error) {
    console.error('Datetime formatting error:', error);
    // Crucial: Return a string on error to prevent React crash
    return 'Invalid Date Format';
  }
}

// Keep your original formatDate function if you need it elsewhere:
export function formatDate(value?: string | null, locale = 'en-US') {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return value;
  }
}