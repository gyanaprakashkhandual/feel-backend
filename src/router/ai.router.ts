import { anthropicChat, anthropicStream, ANTHROPIC_MODELS } from "../configs/anthropic.config";
import { openaiChat, openaiStream, OPENAI_MODELS } from "../configs/open.ai.config";
import { geminiChat, geminiStream, GEMINI_MODELS } from "../configs/gemini.config";

type Provider = "anthropic" | "openai" | "gemini";

interface RouterMessage {
  role: "user" | "assistant";
  content: string;
}

interface RouterOptions {
  provider: Provider;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

function toAnthropicMessages(messages: RouterMessage[]) {
  return messages.map(({ role, content }) => ({ role, content }));
}

function toOpenAIMessages(messages: RouterMessage[]) {
  return messages.map(({ role, content }) => ({
    role: role as "user" | "assistant",
    content,
  }));
}

function toGeminiMessages(messages: RouterMessage[]) {
  return messages.map(({ role, content }) => ({
    role: role === "assistant" ? "model" : "user",
    content,
  })) as { role: "user" | "model"; content: string }[];
}

async function aiChat(messages: RouterMessage[], options: RouterOptions) {
  const { provider, systemPrompt, maxTokens, temperature } = options;

  if (provider === "anthropic") {
    return anthropicChat(toAnthropicMessages(messages), {
      model: (options.model as any) ?? ANTHROPIC_MODELS.SONNET,
      systemPrompt,
      maxTokens,
      temperature,
    });
  }

  if (provider === "openai") {
    return openaiChat(toOpenAIMessages(messages), {
      model: (options.model as any) ?? OPENAI_MODELS.GPT_4O,
      systemPrompt,
      maxTokens,
      temperature,
    });
  }

  if (provider === "gemini") {
    return geminiChat(toGeminiMessages(messages), {
      model: (options.model as any) ?? GEMINI_MODELS.FLASH,
      systemPrompt,
      maxOutputTokens: maxTokens,
      temperature,
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function aiStream(messages: RouterMessage[], options: RouterOptions) {
  const { provider, systemPrompt, maxTokens, temperature } = options;

  if (provider === "anthropic") {
    return anthropicStream(toAnthropicMessages(messages), {
      model: (options.model as any) ?? ANTHROPIC_MODELS.SONNET,
      systemPrompt,
      maxTokens,
      temperature,
    });
  }

  if (provider === "openai") {
    return openaiStream(toOpenAIMessages(messages), {
      model: (options.model as any) ?? OPENAI_MODELS.GPT_4O,
      systemPrompt,
      maxTokens,
      temperature,
    });
  }

  if (provider === "gemini") {
    return geminiStream(toGeminiMessages(messages), {
      model: (options.model as any) ?? GEMINI_MODELS.FLASH,
      systemPrompt,
      maxOutputTokens: maxTokens,
      temperature,
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

export { aiChat, aiStream, Provider, RouterMessage, RouterOptions };