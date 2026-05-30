"use client";
import { useState } from "react";

export default function InfoForm() {
  const [info, setInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send info to backend API
    setSubmitted(true);
  };

  if (submitted) {
    return <div className="success">Info submitted! Thank you.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="info-form">
      <h2>Studio Info Form</h2>
      <label>
        Your Info
        <textarea value={info} onChange={e => setInfo(e.target.value)} required />
      </label>
      <button type="submit">Submit Info</button>
    </form>
  );
}
