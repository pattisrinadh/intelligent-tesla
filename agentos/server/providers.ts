import type { LLMProviderConfig } from './db';

export interface LLMExecutionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  rawUsage?: any;
}

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract execute(
    systemPrompt: string,
    userPrompt: string,
    options: LLMExecutionOptions
  ): Promise<LLMResponse>;

  abstract testConnection(): Promise<{ success: boolean; models: string[]; error?: string }>;
}

export class OpenAICompatibleProvider extends BaseLLMProvider {
  async execute(
    systemPrompt: string,
    userPrompt: string,
    options: LLMExecutionOptions
  ): Promise<LLMResponse> {
    if (!this.config.baseUrl) {
      throw new Error('Provider configuration required: Base URL is not set.');
    }
    if (!this.config.apiKey) {
      throw new Error('Provider configuration required: API key is not configured on the server.');
    }

    const model = options.model || this.config.defaultModel;
    if (!model) {
      throw new Error('No model specified and default model is not configured.');
    }

    const messages = [];
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }
    messages.push({ role: 'user', content: userPrompt.trim() });

    const timeoutMs = options.timeoutMs || 45000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const endpoint = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
          max_tokens: options.maxTokens || 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errJson = await response.json();
          errorDetails = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errorDetails = await response.text();
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(`Provider authentication error (HTTP ${response.status}): Invalid API key. ${errorDetails}`);
        }
        if (response.status === 429) {
          throw new Error(`Provider rate limit reached (HTTP 429): ${errorDetails}`);
        }
        if (response.status === 404 || response.status === 400) {
          throw new Error(`Provider invalid request or unsupported model '${model}' (HTTP ${response.status}): ${errorDetails}`);
        }

        throw new Error(`Provider error (HTTP ${response.status}): ${errorDetails}`);
      }

      const data = await response.json();

      const choice = data.choices?.[0];
      const content = choice?.message?.content || choice?.text || '';

      if (!content && content !== '') {
        throw new Error('Provider returned an empty response with no content choices.');
      }

      const usage = data.usage || {};
      const inputTokens = usage.prompt_tokens || Math.ceil((systemPrompt.length + userPrompt.length) / 4);
      const outputTokens = usage.completion_tokens || Math.ceil(content.length / 4);
      const totalTokens = usage.total_tokens || (inputTokens + outputTokens);

      return {
        content: content.trim(),
        model: data.model || model,
        inputTokens,
        outputTokens,
        totalTokens,
        rawUsage: usage,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Execution timed out after ${timeoutMs / 1000}s while waiting for LLM response.`);
      }
      throw err;
    }
  }

  async testConnection(): Promise<{ success: boolean; models: string[]; error?: string }> {
    try {
      const endpoint = `${this.config.baseUrl.replace(/\/+$/, '')}/models`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, models: [], error: `HTTP ${response.status}: ${text}` };
      }

      const data = await response.json();
      const models = (data.data || []).map((m: any) => m.id || m.name).filter(Boolean);
      return { success: true, models };
    } catch (err: any) {
      return { success: false, models: [], error: err.message };
    }
  }
}

export class BedrockProvider extends OpenAICompatibleProvider {
  // Bedrock Mantle provides OpenAI-compatible REST endpoint
  // Overrides or custom headers can be placed here if needed
}

export class ProviderFactory {
  static create(config: LLMProviderConfig): BaseLLMProvider {
    switch (config.type) {
      case 'bedrock':
        return new BedrockProvider(config);
      case 'openai-compatible':
      case 'openai':
      default:
        return new OpenAICompatibleProvider(config);
    }
  }
}
