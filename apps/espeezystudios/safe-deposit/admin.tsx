import { useState } from "react";

export default function SafeDepositAdmin() {
  // TODO: Fetch and display deposit submissions
  const [deposits] = useState<Record<string, unknown>[]>([]);
  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', padding: 24 }}>
      <h2>Safe Deposit Admin Panel</h2>
      <ul>
        {deposits.length === 0 && <li>No deposits yet.</li>}
        {deposits.map((d, i) => (
          <li key={i}>{JSON.stringify(d)}</li>
        ))}
      </ul>
    </main>
  );
}
