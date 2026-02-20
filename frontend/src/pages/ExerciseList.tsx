import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Exercise } from '../types';

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 600,
  } as React.CSSProperties,
  btn: {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#0066cc',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnDanger: {
    background: '#dc3545',
    padding: '6px 12px',
    fontSize: '13px',
  } as React.CSSProperties,
  btnSecondary: {
    background: '#6c757d',
    padding: '6px 12px',
    fontSize: '13px',
  } as React.CSSProperties,
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '6px',
  } as React.CSSProperties,
  cardDesc: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  } as React.CSSProperties,
  cardMeta: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '12px',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    marginLeft: '8px',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  } as React.CSSProperties,
};

export default function ExerciseList({ mode }: { mode: 'creator' | 'learner' }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listExercises().then(data => {
      setExercises(mode === 'learner' ? data.filter(e => e.published) : data);
      setLoading(false);
    });
  }, [mode]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exercise?')) return;
    await api.deleteExercise(id);
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const handleTogglePublish = async (exercise: Exercise) => {
    const updated = await api.updateExercise(exercise.id, {
      published: !exercise.published,
    } as any);
    setExercises(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>
          {mode === 'creator' ? 'My Exercises' : 'Available Exercises'}
        </h1>
        {mode === 'creator' && (
          <Link to="/create" style={styles.btn}>+ New Exercise</Link>
        )}
      </div>

      {exercises.length === 0 && (
        <div style={styles.empty as any}>
          <p>{mode === 'creator' ? 'No exercises yet. Create your first one!' : 'No exercises available.'}</p>
        </div>
      )}

      {exercises.map(ex => (
        <div key={ex.id} style={styles.card}>
          <div style={styles.cardTitle}>
            {ex.title}
            {mode === 'creator' && (
              <span
                style={{
                  ...styles.badge,
                  background: ex.published ? '#e8f5e9' : '#fff3e0',
                  color: ex.published ? '#2e7d32' : '#e65100',
                }}
              >
                {ex.published ? 'Published' : 'Draft'}
              </span>
            )}
          </div>
          <div style={styles.cardDesc}>{ex.description || 'No description'}</div>
          <div style={styles.cardMeta}>
            End condition: {ex.end_condition_type}
            {ex.end_condition_value ? ` (${ex.end_condition_value})` : ''} |
            Feedback: {ex.feedback_type}
          </div>
          <div style={styles.actions}>
            {mode === 'creator' ? (
              <>
                <Link to={`/edit/${ex.id}`} style={{ ...styles.btn, ...styles.btnSecondary }}>Edit</Link>
                <Link to={`/preview/${ex.id}`} style={{ ...styles.btn, ...styles.btnSecondary }}>Preview</Link>
                <button
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => handleTogglePublish(ex)}
                >
                  {ex.published ? 'Unpublish' : 'Publish'}
                </button>
                <a
                  href={api.getScormUrl(ex.id)}
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  download
                >
                  Export SCORM
                </a>
                <button
                  style={{ ...styles.btn, ...styles.btnDanger }}
                  onClick={() => handleDelete(ex.id)}
                >
                  Delete
                </button>
              </>
            ) : (
              <Link to={`/learn/${ex.id}`} style={styles.btn}>Start Exercise</Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
