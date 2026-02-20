import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import { Exercise, ChatMessage } from '../types';

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 120px)',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  headerInfo: {} as React.CSSProperties,
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
  } as React.CSSProperties,
  headerDesc: {
    fontSize: '13px',
    color: '#888',
    marginTop: '2px',
  } as React.CSSProperties,
  badge: {
    padding: '4px 10px',
    background: '#fff3e0',
    color: '#e65100',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  } as React.CSSProperties,
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  } as React.CSSProperties,
  message: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '12px',
    lineHeight: 1.5,
    fontSize: '14px',
    wordWrap: 'break-word',
  } as React.CSSProperties,
  userMsg: {
    alignSelf: 'flex-end',
    background: '#0066cc',
    color: 'white',
    borderBottomRightRadius: '4px',
  } as React.CSSProperties,
  assistantMsg: {
    alignSelf: 'flex-start',
    background: '#f0f2f5',
    color: '#333',
    borderBottomLeftRadius: '4px',
  } as React.CSSProperties,
  inputArea: {
    padding: '16px 20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '8px',
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  } as React.CSSProperties,
  sendBtn: {
    padding: '12px 24px',
    background: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  } as React.CSSProperties,
  completionPanel: {
    padding: '24px',
    borderTop: '2px solid #00c853',
    textAlign: 'center',
  } as React.CSSProperties,
  completionTitle: {
    color: '#00c853',
    marginBottom: '12px',
    fontSize: '20px',
    fontWeight: 600,
  } as React.CSSProperties,
  feedback: {
    textAlign: 'left',
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    margin: '12px 0',
    fontSize: '14px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  } as React.CSSProperties,
  typing: {
    alignSelf: 'flex-start',
    background: '#f0f2f5',
    padding: '12px 16px',
    borderRadius: '12px',
    borderBottomLeftRadius: '4px',
    display: 'flex',
    gap: '4px',
  } as React.CSSProperties,
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ccc',
    animation: 'bounce 1.4s infinite',
  } as React.CSSProperties,
  backLink: {
    display: 'inline-block',
    marginBottom: '12px',
    fontSize: '14px',
  } as React.CSSProperties,
};

export default function ExerciseChat({ preview = false }: { preview?: boolean }) {
  const { id } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      api.getExercise(id).then(setExercise);
    }
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading || isComplete || !id) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chat(id, newMessages);
      setMessages([...newMessages, { role: 'assistant', content: response.message }]);

      if (response.isComplete) {
        setIsComplete(true);
        setFeedbackText(response.feedback || '');
        setVideoUrl(response.videoUrl || '');
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!exercise) return <p>Loading...</p>;

  return (
    <div>
      <Link to={preview ? '/' : '/learn'} style={styles.backLink}>
        &larr; Back to {preview ? 'exercises' : 'available exercises'}
      </Link>

      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <div style={styles.headerTitle}>{exercise.title}</div>
            {exercise.description && (
              <div style={styles.headerDesc}>{exercise.description}</div>
            )}
          </div>
          {preview && <span style={styles.badge}>Preview Mode</span>}
        </div>

        <div ref={chatRef} style={styles.chatArea} className="chat-area">
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                ...(msg.role === 'user' ? styles.userMsg : styles.assistantMsg),
              }}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div style={styles.typing}>
              <div style={{ ...styles.dot, animationDelay: '0s' }} />
              <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
              <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
            </div>
          )}
        </div>

        {!isComplete ? (
          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
              autoFocus
            />
            <button
              style={{
                ...styles.sendBtn,
                ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
              }}
              onClick={sendMessage}
              disabled={loading}
            >
              Send
            </button>
          </div>
        ) : (
          <div style={styles.completionPanel as any}>
            <div style={styles.completionTitle}>Exercise Complete!</div>
            {feedbackText && (
              <div style={styles.feedback as any}><ReactMarkdown>{feedbackText}</ReactMarkdown></div>
            )}
            {videoUrl && (
              <div style={{ marginTop: '16px' }}>
                {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                  <iframe
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${
                      videoUrl.includes('youtu.be')
                        ? videoUrl.split('/').pop()
                        : new URL(videoUrl).searchParams.get('v')
                    }`}
                    frameBorder="0"
                    allowFullScreen
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                  />
                ) : (
                  <video controls src={videoUrl} style={{ maxWidth: '100%', borderRadius: '8px' }} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .chat-area p:first-child { margin-top: 0; }
        .chat-area p:last-child { margin-bottom: 0; }
        .chat-area hr { border: none; border-top: 1px solid #ccc; margin: 8px 0; }
      `}</style>
    </div>
  );
}
