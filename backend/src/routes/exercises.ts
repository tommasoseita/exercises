import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { Exercise, CreateExerciseInput, UpdateExerciseInput } from '../models';

const router = Router();

// List all exercises
router.get('/', (_req: Request, res: Response) => {
  const exercises = db.prepare('SELECT * FROM exercises ORDER BY created_at DESC').all();
  res.json(exercises);
});

// Get single exercise
router.get('/:id', (req: Request, res: Response) => {
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!exercise) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }
  res.json(exercise);
});

// Create exercise
router.post('/', (req: Request, res: Response) => {
  const input: CreateExerciseInput = req.body;

  if (!input.title || !input.system_prompt || !input.end_condition_type) {
    res.status(400).json({ error: 'title, system_prompt, and end_condition_type are required' });
    return;
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO exercises (id, title, description, system_prompt, end_condition_type, end_condition_value, feedback_type, feedback_message, video_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.title,
    input.description || '',
    input.system_prompt,
    input.end_condition_type,
    input.end_condition_value || '',
    input.feedback_type || 'static',
    input.feedback_message || '',
    input.video_url || ''
  );

  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
  res.status(201).json(exercise);
});

// Update exercise
router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id) as Exercise | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }

  const input: UpdateExerciseInput = req.body;
  const stmt = db.prepare(`
    UPDATE exercises SET
      title = ?,
      description = ?,
      system_prompt = ?,
      end_condition_type = ?,
      end_condition_value = ?,
      feedback_type = ?,
      feedback_message = ?,
      video_url = ?,
      published = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(
    input.title ?? existing.title,
    input.description ?? existing.description,
    input.system_prompt ?? existing.system_prompt,
    input.end_condition_type ?? existing.end_condition_type,
    input.end_condition_value ?? existing.end_condition_value,
    input.feedback_type ?? existing.feedback_type,
    input.feedback_message ?? existing.feedback_message,
    input.video_url ?? existing.video_url,
    input.published !== undefined ? (input.published ? 1 : 0) : existing.published,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete exercise
router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }
  res.status(204).send();
});

export default router;
