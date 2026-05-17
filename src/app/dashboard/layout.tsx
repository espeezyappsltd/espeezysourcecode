import '@/app/dev-hub.css'
import { DevHubAppLayout } from '@/components/dev-hub/DevHubAppLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DevHubAppLayout>{children}</DevHubAppLayout>
}
