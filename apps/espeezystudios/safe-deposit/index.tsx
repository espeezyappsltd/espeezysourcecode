import SafeDepositForm from './SafeDepositForm';
import LinksToApps from './LinksToApps';

export default function SafeDepositPage() {
  return (
    <main style={{ maxWidth: 500, margin: '2rem auto', padding: 24 }}>
      <SafeDepositForm />
      <LinksToApps />
    </main>
  );
}
