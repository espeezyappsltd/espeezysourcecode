/**
 * AdminLoadingScreen
 *
 * Shown while the user's profile is being fetched or while the auth check
 * is in progress. Keeps the user from seeing a flash of the dashboard.
 */

export default function AdminLoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}
    >
      <div className="animate-pulse">Authenticating Admin Protocol...</div>
    </div>
  )
}
