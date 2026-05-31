import { redirect } from 'next/navigation'

/** Legacy path: storage lives at /assets */
export default function AssetsStorageRedirect() {
  redirect('/assets')
}
