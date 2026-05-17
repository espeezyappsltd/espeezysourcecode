"use client"

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Game } from '@/types/games';
import { getSupabaseClient } from '@/lib/supabase-client';
import Image from 'next/image';

export default function GameDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // Fetch game details only
    async function fetchGame() {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError('Authentication is not configured.')
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('games')
        .select('id, name, url, description, image_url, author, created_at, clicked_count')
        .eq('id', id)
        .single();
      if (error) setError(error.message);
      else setGame(data);
      setLoading(false);
    }
    fetchGame();
  }, [id]);
  // Handler for Play Game button
  const handlePlayGame = async () => {
    if (!game) return;
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.rpc('increment_game_click', { game_id: game.id });
    const { data, error } = await supabase
      .from('games')
      .select('clicked_count')
      .eq('id', game.id)
      .single();
    if (!error && data) {
      setGame({ ...game, clicked_count: data.clicked_count });
    }
    // Open the game in a new tab
    window.open(game.url, '_blank', 'noopener');
  };

  if (loading) return <div>Loading game…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!game) return <div style={{ color: '#64748b' }}>Game not found.</div>;

  return (
    <section style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1rem' }}>
      <button onClick={() => router.back()} style={{ marginBottom: 24, background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
        ← Back
      </button>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: 18 }}>{game.name}</h1>
      {game.image_url && (
        <Image
          src={game.image_url}
          alt={game.name}
          width={600}
          height={340}
          style={{ maxWidth: '100%', height: 'auto', borderRadius: 10, marginBottom: 18 }}
          priority
        />
      )}
      <div style={{ color: '#475569', fontSize: '1.1rem', marginBottom: 18 }}>{game.description || 'No description.'}</div>
      <div style={{ marginBottom: 10 }}><strong>Author:</strong> {game.author || 'Unknown'}</div>
      <div style={{ marginBottom: 10 }}><strong>Uploaded:</strong> {game.created_at ? new Date(game.created_at).toLocaleString() : 'Unknown'}</div>
      <div style={{ marginBottom: 18 }}><strong>Clicked count:</strong> {game.clicked_count || 0}</div>
      <button
        onClick={handlePlayGame}
        style={{ background: '#059669', color: '#fff', borderRadius: 7, padding: '0.7rem 1.5rem', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}
      >
        Play Game
      </button>
    </section>
  );
}
