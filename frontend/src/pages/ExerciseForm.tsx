import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { EndConditionType, FeedbackType } from '../types';

const styles = {
  form: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '24px',
  } as React.CSSProperties,
  field: {
    marginBottom: '20px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#333',
  } as React.CSSProperties,
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    outline: 'none',
    minHeight: '120px',
    resize: 'vertical' as const,
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  } as React.CSSProperties,
  btn: {
    padding: '10px 24px',
    background: '#0066cc',
    color: 'white',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  } as React.CSSProperties,
  btnCancel: {
    padding: '10px 24px',
    background: '#e0e0e0',
    color: '#333',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  error: {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '12px',
  } as React.CSSProperties,
};

export default function ExerciseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [endConditionType, setEndConditionType] = useState<EndConditionType>('max_turns');
  const [endConditionValue, setEndConditionValue] = useState('5');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('static');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      api.getExercise(id).then(ex => {
        setTitle(ex.title);
        setDescription(ex.description);
        setSystemPrompt(ex.system_prompt);
        setEndConditionType(ex.end_condition_type);
        setEndConditionValue(ex.end_condition_value);
        setFeedbackType(ex.feedback_type);
        setFeedbackMessage(ex.feedback_message);
        setVideoUrl(ex.video_url);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !systemPrompt.trim()) {
      setError('Title and system prompt are required.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        system_prompt: systemPrompt.trim(),
        end_condition_type: endConditionType,
        end_condition_value: endConditionValue.trim(),
        feedback_type: feedbackType,
        feedback_message: feedbackMessage.trim(),
        video_url: videoUrl.trim(),
      };

      if (isEdit) {
        await api.updateExercise(id!, data);
      } else {
        await api.createExercise(data);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 style={styles.title}>{isEdit ? 'Edit Exercise' : 'Create Exercise'}</h1>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.field}>
          <label style={styles.label}>Title *</label>
          <input
            style={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Medical History Interview Practice"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <input
            style={styles.input}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of the exercise"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>System Prompt *</label>
          <textarea
            style={styles.textarea}
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="Instructions for the AI agent. Define its persona, behavior, goals, and constraints."
          />
          <div style={styles.hint}>
            This defines how the AI agent behaves during the exercise.
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>End Condition</label>
          <select
            style={styles.select}
            value={endConditionType}
            onChange={e => setEndConditionType(e.target.value as EndConditionType)}
          >
            <option value="max_turns">Max turns (conversation rounds)</option>
            <option value="keyword">Keyword detected in AI response</option>
            <option value="ai_decides">AI decides when to end</option>
          </select>
        </div>

        {endConditionType === 'max_turns' && (
          <div style={styles.field}>
            <label style={styles.label}>Max Turns</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              max="50"
              value={endConditionValue}
              onChange={e => setEndConditionValue(e.target.value)}
            />
          </div>
        )}

        {endConditionType === 'keyword' && (
          <div style={styles.field}>
            <label style={styles.label}>End Keyword</label>
            <input
              style={styles.input}
              value={endConditionValue}
              onChange={e => setEndConditionValue(e.target.value)}
              placeholder="e.g., EXERCISE_DONE"
            />
            <div style={styles.hint}>
              The AI will include this keyword when it determines the exercise is complete.
            </div>
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Feedback Type</label>
          <select
            style={styles.select}
            value={feedbackType}
            onChange={e => setFeedbackType(e.target.value as FeedbackType)}
          >
            <option value="static">Static message</option>
            <option value="ai_generated">AI-generated feedback</option>
          </select>
        </div>

        {feedbackType === 'static' && (
          <div style={styles.field}>
            <label style={styles.label}>Feedback Message</label>
            <textarea
              style={{ ...styles.textarea, fontFamily: 'inherit', minHeight: '80px' }}
              value={feedbackMessage}
              onChange={e => setFeedbackMessage(e.target.value)}
              placeholder="Message shown to the learner after completion"
            />
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Video URL (optional)</label>
          <input
            style={styles.input}
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="YouTube URL or direct video link shown after completion"
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.actions}>
          <button type="submit" style={styles.btn} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Exercise' : 'Create Exercise'}
          </button>
          <button type="button" style={styles.btnCancel} onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
