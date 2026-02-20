import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db';
import { Exercise, ChatMessage } from '../models';

const router = Router();

const client = new Anthropic();

function buildEndConditionInstruction(exercise: Exercise): string {
  switch (exercise.end_condition_type) {
    case 'max_turns':
      return ''; // Handled client-side by counting turns
    case 'keyword':
      return `\n\nIMPORTANT: When the exercise is complete, you MUST include the exact keyword "${exercise.end_condition_value}" somewhere in your final message. This signals the end of the exercise.`;
    case 'ai_decides':
      return `\n\nIMPORTANT: When you determine the exercise is complete based on your judgment, you MUST include the exact keyword "EXERCISE_COMPLETE" somewhere in your final message. This signals the end of the exercise.`;
    default:
      return '';
  }
}

// Send a chat message within an exercise
router.post('/:exerciseId', async (req: Request, res: Response) => {
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.exerciseId) as Exercise | undefined;
  if (!exercise) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }

  const { messages }: { messages: ChatMessage[] } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  const systemPrompt = exercise.system_prompt + buildEndConditionInstruction(exercise);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    // Check end conditions
    let isComplete = false;
    switch (exercise.end_condition_type) {
      case 'max_turns': {
        const maxTurns = parseInt(exercise.end_condition_value, 10) || 5;
        const assistantTurns = messages.filter(m => m.role === 'assistant').length + 1;
        isComplete = assistantTurns >= maxTurns;
        break;
      }
      case 'keyword':
        isComplete = assistantMessage.includes(exercise.end_condition_value);
        break;
      case 'ai_decides':
        isComplete = assistantMessage.includes('EXERCISE_COMPLETE');
        break;
    }

    // Generate AI feedback if needed
    let feedback = exercise.feedback_message;
    if (isComplete && exercise.feedback_type === 'ai_generated') {
      const allMessages = [...messages, { role: 'assistant' as const, content: assistantMessage }];
      const feedbackResponse = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: 'Basandoti sulla seguente conversazione di un esercizio educativo, fornisci un feedback costruttivo allo studente sulla sua performance. Sii specifico, incoraggiante e suggerisci aree di miglioramento. Rispondi sempre in italiano.',
        messages: [
          {
            role: 'user',
            content: `Exercise: "${exercise.title}"\nDescription: ${exercise.description}\n\nConversation:\n${allMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`,
          },
        ],
      });
      feedback = feedbackResponse.content[0].type === 'text' ? feedbackResponse.content[0].text : feedback;
    }

    // Record completion
    if (isComplete) {
      const allMessages = [...messages, { role: 'assistant' as const, content: assistantMessage }];
      db.prepare(`
        INSERT INTO completions (id, exercise_id, messages, feedback)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), exercise.id, JSON.stringify(allMessages), feedback);
    }

    // Clean the EXERCISE_COMPLETE marker from the displayed message
    let displayMessage = assistantMessage;
    if (exercise.end_condition_type === 'ai_decides') {
      displayMessage = displayMessage.replace(/EXERCISE_COMPLETE/g, '').trim();
    }

    res.json({
      message: displayMessage,
      isComplete,
      feedback: isComplete ? feedback : null,
      videoUrl: isComplete && exercise.video_url ? exercise.video_url : null,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router;
