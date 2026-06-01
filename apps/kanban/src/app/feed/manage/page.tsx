import { redirect } from 'next/navigation'

/** Legacy path — manage posts on the main feed with a filter. */
export default function FeedManageRedirect() {
  redirect('/feed?mine=1')
}
