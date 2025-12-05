import { GoogleGenAI } from "@google/genai";
import { FileAttachment, AppSettings } from "../types";

const getGoogleClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// Generic OpenAI-compatible client for custom providers
const generateOpenAICompatibleStream = async (
  messages: any[],
  settings: AppSettings,
  onChunk: (text: string) => void
) => {
  if (!settings.customApiKey) {
    throw new Error(`Please provide an API Key for ${settings.provider} in Settings.`);
  }

  const baseUrl = settings.customBaseUrl?.replace(/\/+$/, '') || getProviderDefaultUrl(settings.provider);
  const url = `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.customApiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messages,
        temperature: settings.temperature,
        stream: true
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") continue;
          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) onChunk(content);
          } catch (e) {
            console.warn("Failed to parse chunk", e);
          }
        }
      }
    }

  } catch (error) {
    console.error(`${settings.provider} generation failed`, error);
    throw error;
  }
};

const getProviderDefaultUrl = (provider: string) => {
    switch(provider) {
        case 'openai': return 'https://api.openai.com/v1';
        case 'deepseek': return 'https://api.deepseek.com';
        case 'kimi': return 'https://api.moonshot.cn/v1';
        default: return '';
    }
};

// Generate a full draft based on a prompt and optional files
export const generateDraftStream = async (
  prompt: string,
  files: FileAttachment[],
  settings: AppSettings,
  onChunk: (text: string) => void
) => {
  // If not Google, route to generic handler
  if (settings.provider !== 'google') {
    // Construct messages for OpenAI format
    const systemMsg = "You are an expert ghostwriter. Return content as semantic HTML (h1, h2, p, ul, li). Do NOT use Markdown.";
    const userMsg = {
        role: 'user',
        content: prompt
    };
    
    // Note: Simple text support for now for custom providers. 
    // Image support would require constructing the specific 'image_url' or 'content' array format for each provider.
    if (files.length > 0) {
        // Simple append for context
        userMsg.content += `\n\n[Attached ${files.length} files - Visual content analysis skipped for non-Gemini provider]`;
    }

    return generateOpenAICompatibleStream(
        [{ role: 'system', content: systemMsg }, userMsg],
        settings,
        onChunk
    );
  }

  // --- GOOGLE GEMINI IMPLEMENTATION ---
  const ai = getGoogleClient();
  const model = settings.model;

  const parts: any[] = [];
  
  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  parts.push({
    text: `You are an expert ghostwriter and thought partner. 
    Write a comprehensive, high-quality draft based on the following request. 
    
    IMPORTANT FORMATTING INSTRUCTIONS:
    - Return the content as semantic HTML (e.g., <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>).
    - Do NOT include <html>, <head>, or <body> tags.
    - Do NOT use Markdown syntax (no #, ##, **, etc).
    - Use a clean, engaging style.
    
    Request: ${prompt}`
  });

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: [{
        role: 'user',
        parts: parts
      }],
      config: {
        temperature: settings.temperature,
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error: any) {
    handleGeminiError(error);
  }
};

// Rewrite a specific selection of text
export const rewriteSelectionStream = async (
  selection: string,
  fullContext: string,
  instruction: string,
  settings: AppSettings,
  onChunk: (text: string) => void
) => {
  if (settings.provider !== 'google') {
      const messages = [
          { role: 'system', content: 'You are an expert editor. Return ONLY the rewritten HTML fragment.' },
          { role: 'user', content: `Context:\n${fullContext.slice(0, 1000)}...\n\nRewrite this selection:\n"${selection}"\n\nInstruction: ${instruction}` }
      ];
      return generateOpenAICompatibleStream(messages, settings, onChunk);
  }

  const ai = getGoogleClient();
  const model = settings.model;

  const prompt = `
  You are an expert editor. 
  I will provide a full document context (HTML) and a specific selection I want you to rewrite.
  
  Context of the document:
  """
  ${fullContext.slice(0, 3000)}... (truncated for brevity)
  """

  The specific text to rewrite is:
  """
  ${selection}
  """

  Instruction for rewrite: "${instruction}"

  Return ONLY the rewritten text as valid HTML fragments. 
  Do not add quotes or conversational filler.
  Maintain formatting tags (<b>, <i>) if appropriate.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      config: {
        temperature: settings.temperature,
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    handleGeminiError(error);
  }
};

// Translate content to target language
export const translateContentStream = async (
  content: string,
  targetLanguage: string,
  settings: AppSettings,
  onChunk: (text: string) => void
) => {
  if (!content) return;

  const prompt = `
  You are a professional translator. 
  Translate the following HTML content into professional, high-quality ${targetLanguage}.
  
  Rules:
  1. Maintain the original HTML structure and tags (h1, p, ul, etc.) exactly so it matches the visual layout of the original.
  2. Only translate the visible text content.
  3. Ensure the tone is appropriate for the context (professional/native).
  4. Return ONLY the translated HTML string. 
  5. Do NOT use markdown code blocks (e.g., \`\`\`html). Just return raw HTML.

  Content to translate:
  """
  ${content}
  """
  `;

  if (settings.provider !== 'google') {
      const messages = [
          { role: 'system', content: `You are a professional translator. Translate to ${targetLanguage}. Maintain HTML structure.` },
          { role: 'user', content: prompt }
      ];
      return generateOpenAICompatibleStream(messages, settings, onChunk);
  }

  const ai = getGoogleClient();
  const model = settings.model;

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      config: {
        temperature: 0.3, // Lower temperature for more accurate translation
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        // Strip markdown code blocks if the model insists on adding them
        const cleanChunk = chunk.text.replace(/^```html\s*/i, '').replace(/```$/, '');
        onChunk(cleanChunk);
      }
    }
  } catch (error) {
    handleGeminiError(error);
  }
};

const handleGeminiError = (error: any) => {
    console.error("Gemini operation failed", error);
    let message = "An unexpected error occurred.";
    
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("401") || msg.includes("api key")) {
            message = "Authentication failed. Please check your API key.";
        } else if (msg.includes("429") || msg.includes("quota")) {
            message = "Rate limit exceeded. Try again later.";
        } else if (msg.includes("safety") || msg.includes("blocked")) {
            message = "Generation blocked due to safety guidelines.";
        } else if (msg.includes("not found") || msg.includes("404")) {
            message = "Model endpoint not found or request ambiguous. Please check Settings > Model.";
        } else {
             message = `Error: ${error.message}`;
        }
    }
    throw new Error(message);
};