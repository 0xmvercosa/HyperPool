/**
 * Safe BigInt conversion utilities to prevent NaN errors
 */

/**
 * Safely converts a value to BigInt with fallback
 * @param value - The value to convert (string, number, or bigint)
 * @param fallback - The fallback value if conversion fails (default: 0n)
 * @returns BigInt value or fallback
 */
export function safeBigInt(value: any, fallback: bigint = 0n): bigint {
  try {
    // Handle null/undefined
    if (value === null || value === undefined) {
      console.warn('safeBigInt: received null/undefined, using fallback', fallback);
      return fallback;
    }

    // If already BigInt, return it
    if (typeof value === 'bigint') {
      return value;
    }

    // If string, check for valid number format
    if (typeof value === 'string') {
      // Remove whitespace
      const trimmed = value.trim();

      // Check for empty string
      if (trimmed === '') {
        console.warn('safeBigInt: empty string, using fallback', fallback);
        return fallback;
      }

      // Check for NaN, null, undefined as strings
      if (trimmed === 'NaN' || trimmed === 'null' || trimmed === 'undefined') {
        console.warn('safeBigInt: invalid string value:', trimmed, 'using fallback', fallback);
        return fallback;
      }

      // Try to parse as number first to validate
      const num = Number(trimmed);
      if (isNaN(num)) {
        console.warn('safeBigInt: string is not a valid number:', trimmed, 'using fallback', fallback);
        return fallback;
      }

      // Convert to integer and then to BigInt
      const intValue = Math.floor(num);
      return BigInt(intValue);
    }

    // If number, check for NaN and convert
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        console.warn('safeBigInt: number is NaN or Infinity:', value, 'using fallback', fallback);
        return fallback;
      }

      // Convert to integer and then to BigInt
      const intValue = Math.floor(value);
      return BigInt(intValue);
    }

    // For any other type, try to convert via Number
    const num = Number(value);
    if (isNaN(num)) {
      console.warn('safeBigInt: unable to convert value:', value, 'using fallback', fallback);
      return fallback;
    }

    return BigInt(Math.floor(num));
  } catch (error) {
    console.error('safeBigInt: error converting value:', value, error, 'using fallback', fallback);
    return fallback;
  }
}

/**
 * Safely parses a number from any value
 * @param value - The value to parse
 * @param fallback - The fallback value if parsing fails (default: 0)
 * @returns Number value or fallback
 */
export function safeNumber(value: any, fallback: number = 0): number {
  try {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return fallback;
    }

    // If already number, check for NaN
    if (typeof value === 'number') {
      return isNaN(value) || !isFinite(value) ? fallback : value;
    }

    // If string, try to parse
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'NaN' || trimmed === 'null' || trimmed === 'undefined') {
        return fallback;
      }
      const num = Number(trimmed);
      return isNaN(num) ? fallback : num;
    }

    // Try to convert any other type
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  } catch (error) {
    console.error('safeNumber: error parsing value:', value, error);
    return fallback;
  }
}

/**
 * Safely multiplies a BigInt by a percentage
 * @param value - The BigInt value
 * @param percentage - The percentage (e.g., 0.2 for 20%)
 * @returns Result as BigInt
 */
export function safeBigIntMultiply(value: bigint, percentage: number): bigint {
  try {
    const multiplier = Math.floor(percentage * 10000);
    return (value * BigInt(multiplier)) / 10000n;
  } catch (error) {
    console.error('safeBigIntMultiply: error:', error);
    return value;
  }
}