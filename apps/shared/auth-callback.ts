import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js'

export type AuthCallbackParams = {
  code: string | null
  tokenHash: string | null
  type: string | null
  errorParam: string | null
  errorDesc: string | null
  isRecovery: boolean
}

export function parseAuthCallbackParams(searchParams: URLSearchParams): AuthCallbackParams {
  const type = searchParams.get('type')
  return {
    code: searchParams.get('code'),
    tokenHash: searchParams.get('token_hash'),
    type,
    errorParam: searchParams.get('error'),
    errorDesc: searchParams.get('error_description'),
    isRecovery: type === 'recovery',
  }
}

function recoveryErrorMessage(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('code verifier') || lower.includes('pkce')) {
    return 'Open the reset link in the same browser where you clicked “Forgot password”, or request a new link from the login page.'
  }
  if (lower.includes('expired') || lower.includes('invalid')) {
    return 'This reset link has expired. Request a new one from the login page.'
  }
  return message
}

export async function completeAuthCallback(
  supabase: SupabaseClient,
  params: AuthCallbackParams,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (params.errorParam || params.errorDesc) {
    const msg = params.errorDesc || params.errorParam || 'Authentication failed'
    return {
      ok: false,
      message: params.isRecovery ? recoveryErrorMessage(msg) : msg,
    }
  }

  if (params.tokenHash && params.type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: 'recovery' as EmailOtpType,
    })
    if (error) {
      return { ok: false, message: recoveryErrorMessage(error.message) }
    }
    return { ok: true }
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    if (error) {
      return {
        ok: false,
        message: params.isRecovery ? recoveryErrorMessage(error.message) : error.message,
      }
    }
  }

  return { ok: true }
}
