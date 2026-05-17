/** Remove ANSI escape codes from terminal output for readable log UI. */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '')
}
