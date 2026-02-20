import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ExerciseList from './pages/ExerciseList';
import ExerciseForm from './pages/ExerciseForm';
import ExerciseChat from './pages/ExerciseChat';

const styles = {
  nav: {
    background: '#1a1a2e',
    color: 'white',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  } as React.CSSProperties,
  brand: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'white',
    textDecoration: 'none',
  } as React.CSSProperties,
  link: {
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '4px 12px',
    borderRadius: '4px',
  } as React.CSSProperties,
  activeLink: {
    color: 'white',
    background: 'rgba(255,255,255,0.15)',
  } as React.CSSProperties,
  main: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px',
  } as React.CSSProperties,
};

export default function App() {
  const location = useLocation();
  const isCreator = !location.pathname.startsWith('/learn');

  return (
    <>
      <nav style={styles.nav}>
        <Link to="/" style={styles.brand}>AI Exercise Platform</Link>
        <Link
          to="/"
          style={{ ...styles.link, ...(isCreator ? styles.activeLink : {}) }}
        >
          Creator
        </Link>
        <Link
          to="/learn"
          style={{ ...styles.link, ...(!isCreator ? styles.activeLink : {}) }}
        >
          Learner
        </Link>
      </nav>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<ExerciseList mode="creator" />} />
          <Route path="/create" element={<ExerciseForm />} />
          <Route path="/edit/:id" element={<ExerciseForm />} />
          <Route path="/preview/:id" element={<ExerciseChat preview />} />
          <Route path="/learn" element={<ExerciseList mode="learner" />} />
          <Route path="/learn/:id" element={<ExerciseChat />} />
        </Routes>
      </main>
    </>
  );
}
