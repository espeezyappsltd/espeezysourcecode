"use client";
import { useState } from "react";

export default function SafeDepositForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [info, setInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send data to backend API
    setSubmitted(true);
  };

  if (submitted) {
    return <div className="success">Deposit submitted! We will contact you soon.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="safe-deposit-form">
      <h2>Safe Deposit Form</h2>
      <label>
        Name
        <input value={name} onChange={e => setName(e.target.value)} required />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </label>
      <label>
        Deposit Amount
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" />
      </label>
      <label>
        Additional Info
        <textarea value={info} onChange={e => setInfo(e.target.value)} />
      </label>
      <button type="submit">Submit Deposit</button>
    </form>
  );
}
