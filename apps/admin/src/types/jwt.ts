export interface JwtPayload {
  sub?: string
  email?: string
  aud?: string
  exp?: number
  iat?: number
  role?: string
  [key: string]: string | number | boolean | undefined
}
