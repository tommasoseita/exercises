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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  isComplete: boolean;
  feedback: string | null;
  videoUrl: string | null;
}
