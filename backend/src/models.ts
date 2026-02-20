export type EndConditionType = 'max_turns' | 'keyword' | 'ai_decides';
export type FeedbackType = 'static' | 'ai_generated';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  system_prompt: string;
  end_condition_type: EndConditionType;
  end_condition_value: string;
  feedback_type: FeedbackType;
  feedback_message: string;
  video_url: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export interface Completion {
  id: string;
  exercise_id: string;
  learner_id: string;
  messages: string;
  feedback: string;
  completed_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CreateExerciseInput {
  title: string;
  description?: string;
  system_prompt: string;
  end_condition_type: EndConditionType;
  end_condition_value?: string;
  feedback_type?: FeedbackType;
  feedback_message?: string;
  video_url?: string;
}

export interface UpdateExerciseInput extends Partial<CreateExerciseInput> {
  published?: boolean;
}
