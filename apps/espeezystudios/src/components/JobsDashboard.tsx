import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';
import { useRealtimeJobs } from '../hooks/useRealtimeJobs';

export type Job = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at?: string;
};

export default function JobsDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'pending' });
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Metrics
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress').length;
  const doneJobs = jobs.filter(j => j.status === 'done').length;


  const fetchJobsCallback = useCallback(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeJobs(fetchJobsCallback);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let changed = false;
    if (editingJob) {
      const { error } = await supabase.from('jobs').update(form).eq('id', editingJob.id);
      changed = !error;
    } else {
      const { error } = await supabase.from('jobs').insert([{ ...form }]);
      changed = !error;
    }
    setShowModal(false);
    setForm({ title: '', description: '', status: 'pending' });
    setEditingJob(null);
    if (changed) await fetchJobs();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (!error) await fetchJobs();
  }

  function openEdit(job: Job) {
    setEditingJob(job);
    setForm({ title: job.title, description: job.description, status: job.status });
    setShowModal(true);
  }

  function openAdd() {
    setEditingJob(null);
    setForm({ title: '', description: '', status: 'pending' });
    setShowModal(true);
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Jobs Queue</h2>
      {/* Metrics */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600 }}>Total: {totalJobs}</span>
        <span style={{ color: '#f59e42' }}>Pending: {pendingJobs}</span>
        <span style={{ color: '#38bdf8' }}>In Progress: {inProgressJobs}</span>
        <span style={{ color: '#22c55e' }}>Done: {doneJobs}</span>
      </div>
      <button onClick={openAdd} style={{ marginBottom: 16 }}>Add Job</button>
      {loading ? (
        <p>Loading...</p>
      ) : jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice((page-1)*pageSize, page*pageSize).map((job, idx) => (
                <tr key={job.id}>
                  <td>{(page-1)*pageSize + idx + 1}</td>
                  <td>{job.title}</td>
                  <td style={{ maxWidth: 200, overflowWrap: 'break-word' }}>{job.description}</td>
                  <td>{job.status}</td>
                  <td>
                    <button onClick={() => openEdit(job)}>Edit</button>
                    <button onClick={() => handleDelete(job.id)} style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
            <span>Page {page} / {Math.max(1, Math.ceil(jobs.length / pageSize))}</span>
            <button disabled={page >= Math.ceil(jobs.length / pageSize)} onClick={() => setPage(p => p+1)}>Next</button>
          </div>
        </div>
      )}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3>{editingJob ? 'Edit Job' : 'Add Job'}</h3>
            <label>
              Title
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <br />
            <label>
              Description
              <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            <br />
            <label>
              Status
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <br />
            <button type="submit">{editingJob ? 'Update' : 'Add'} Job</button>
            <button type="button" onClick={() => setShowModal(false)} style={{ marginLeft: 8 }}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
