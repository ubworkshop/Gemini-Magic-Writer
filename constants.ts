import { AppSettings } from "./types";

export const APP_NAME = "Gemini Magic Writer";
export const PLACEHOLDER_TEXT = "Start writing or press the sparkles icon to generate a draft...";

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'google',
  model: 'gemini-3-pro-preview',
  temperature: 0.7,
  customApiKey: '',
  customBaseUrl: ''
};

export const AI_PROVIDERS = [
  { id: 'google', name: 'Google Gemini', icon: 'Sparkles', active: true, defaultBaseUrl: '' },
  { id: 'openai', name: 'OpenAI', icon: 'Bot', active: true, defaultBaseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', name: 'DeepSeek', icon: 'Brain', active: true, defaultBaseUrl: 'https://api.deepseek.com' },
  { id: 'kimi', name: 'Moonshot Kimi', icon: 'Moon', active: true, defaultBaseUrl: 'https://api.moonshot.cn/v1' },
];

export const MODEL_OPTIONS = {
  google: [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Best for Reasoning)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fastest)' },
    { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Flash Lite (Cost Effective)' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
  ],
  kimi: [
    { id: 'moonshot-v1-8k', name: 'Kimi 8k' },
    { id: 'moonshot-v1-32k', name: 'Kimi 32k' },
  ]
};

export const SUGGESTED_PROMPTS = [
  "Draft a blog post about the future of AI",
  "Write a professional email declining a job offer",
  "Create a project proposal for a new mobile app",
  "Summarize the key takeaways from the attached image"
];

export const PROMPT_TEMPLATES = [
  {
    id: 'blog',
    label: 'Blog Post',
    description: 'SEO-friendly article structure',
    prompt: 'Write an engaging blog post about [TOPIC]. Include a catchy title, introduction, 3 main sections with headers, and a conclusion.',
    icon: 'PenTool'
  },
  {
    id: 'email',
    label: 'Professional Email',
    description: 'Clear & concise outreach',
    prompt: 'Draft a professional email to [RECIPIENT] regarding [SUBJECT]. Keep it concise, polite, and end with a clear call to action.',
    icon: 'Mail'
  },
  {
    id: 'summary',
    label: 'Summarize',
    description: 'Bullet points & insights',
    prompt: 'Analyze the attached content and provide a structured summary. Include key takeaways, main arguments, and actionable insights.',
    icon: 'FileText'
  },
  {
    id: 'social',
    label: 'Social Thread',
    description: 'Viral social media content',
    prompt: 'Create a 5-part social media thread about [TOPIC]. Use a hook for the first post, provide value in the middle, and end with engagement.',
    icon: 'Share2'
  }
];
