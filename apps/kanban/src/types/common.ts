/** Firestore-style or serialized timestamp with epoch seconds */
export interface TimestampWithSeconds {
  seconds: number
  nanoseconds?: number
}

export type DateInput = string | number | Date | TimestampWithSeconds | null

export function isTimestampWithSeconds(value: unknown): value is TimestampWithSeconds {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as TimestampWithSeconds).seconds === 'number'
  )
}

export type CsvCell = string | number
