import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, isValidLocale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale

  let messages
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch {
    // Fallback to English if locale file is missing
    messages = (await import(`../../messages/en.json`)).default
  }

  return {
    locale,
    messages,
  }
})
