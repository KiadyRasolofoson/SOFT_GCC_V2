import { AiConversationId } from './ai-agent.models';

export type AiChatRole = 'user' | 'assistant';

export interface AiChatMessage {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: number;
}

export interface AiChatConversation {
  id: AiConversationId;
  title: string;
  updatedAt: number;
  messages: AiChatMessage[];
  loaded: boolean;
}
