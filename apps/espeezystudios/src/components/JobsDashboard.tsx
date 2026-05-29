import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';

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

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingJob) {
      await supabase.from('jobs').update(form).eq('id', editingJob.id);
    } else {
      await supabase.from('jobs').insert([{ ...form }]);
    }
    setShowModal(false);
    setForm({ title: '', description: '', status: 'pending' });
    setEditingJob(null);
    fetchJobs();
  }

  async function handleDelete(id: string) {
    await supabase.from('jobs').delete().eq('id', id);
    fetchJobs();
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
      <button onClick={openAdd} style={{ marginBottom: 16 }}>Add Job</button>
      {loading ? (
        <p>Loading...</p>
      ) : jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.description}</td>
                <td>{job.status}</td>
                <td>
                  <button onClick={() => openEdit(job)}>Edit</button>
                  <button onClick={() => handleDelete(job.id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
