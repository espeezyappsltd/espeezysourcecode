import { redirect } from 'next/navigation'

/** Nav uses /admin-lobby; canonical route folder is admin_lobby. */
export default function AdminLobbyAliasPage() {
  redirect('/admin_lobby')
}
