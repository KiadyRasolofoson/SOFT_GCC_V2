export type AiConversationId = number | 'draft';

export interface AiChatRequest {
  conversationId?: number;
  message: string;
  mode?: string;
}

export interface AiChatResponse {
  conversationId: number;
  mode: string;
  provider: string;
  model: string;
  reply: string;
  title?: string;
  toolsUsed: string[];
  warning?: string | null;
}

export interface AiConversationSummary {
  id: number;
  title: string;
  lastMode: string;
  provider: string;
  model: string;
  updatedAt: string;
}

export interface AiMessageDto {
  id: number;
  role: string;
  content: string;
  toolName?: string | null;
  createdAt: string;
}

export interface AiConversationDetail extends AiConversationSummary {
  createdAt: string;
  messages: AiMessageDto[];
}

export interface AiProviderCatalog {
  id: string;
  displayName: string;
  requiresApiKey: boolean;
  supportsTools: boolean;
  defaultBaseUrl: string;
  suggestedModels: string[];
}

export interface AiProviderConfig {
  provider: string;
  baseUrl?: string | null;
  defaultModel?: string | null;
  hasApiKey: boolean;
}

export interface AiAgentSettings {
  activeProvider: string;
  activeModel: string;
  isEnabled: boolean;
  maxTokens: number;
  maxToolRounds: number;
  temperature: number;
  providers: AiProviderConfig[];
}

export interface UpdateAiAgentSettings {
  provider?: string;
  model?: string;
  isEnabled?: boolean;
  maxTokens?: number;
  maxToolRounds?: number;
  temperature?: number;
}

export interface UpdateAiProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  clearApiKey?: boolean;
}

export interface AiProviderTestResult {
  success: boolean;
  provider: string;
  model: string;
  message: string;
}

export interface AiToolInfo {
  key: string;
  description: string;
  requiredPermissions: string[];
  allowedForCurrentUser: boolean;
}

export interface AiToolPermission {
  id: number;
  roleId?: number | null;
  userId?: number | null;
  toolKey: string;
  isAllowed: boolean;
}

export interface UpsertAiToolPermission {
  roleId?: number | null;
  userId?: number | null;
  toolKey: string;
  isAllowed: boolean;
}
