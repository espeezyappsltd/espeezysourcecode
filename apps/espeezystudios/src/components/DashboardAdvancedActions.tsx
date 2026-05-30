"use client";
import { useEffect, useState } from 'react';
import { Download, FileText, BarChart2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabase-client';

async function downloadCSV() {
  const { data, error } = await supabase.from('jobs').select('*');
  if (error || !data) {
    console.error('Supabase jobs fetch error (CSV):', error);
    alert('Failed to fetch jobs');
    return;
  }
  const csv = [
    Object.keys(data[0] || {}).join(','),
    ...data.map((row: Record<string, unknown>) => Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'jobs-export.csv');
}

async function downloadPDF() {
  const { data, error } = await supabase.from('jobs').select('*');
  if (error || !data) {
    console.error('Supabase jobs fetch error (PDF):', error);
    alert('Failed to fetch jobs');
    return;
  }
  const rows = data.map((row: Record<string, unknown>) => Object.values(row).join(' | ')).join('\n');
  const pdfText = `Jobs Export\n\n${Object.keys(data[0] || {}).join(' | ')}\n${rows}`;
  const blob = new Blob([pdfText], { type: 'application/pdf' });
  saveAs(blob, 'jobs-export.pdf');
}

export default function DashboardAdvancedActions() {
  return (
    <div style={{ display: 'flex', gap: '1.2rem', margin: '0 0 2.2rem 0', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button className="dashboard-action-btn" onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Download size={18} /> Download CSV
      </button>
      <button className="dashboard-action-btn" onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={18} /> Download PDF
      </button>
      <button className="dashboard-action-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart2 size={18} /> Advanced Analytics (Coming Soon)
      </button>
    </div>
  );
}
