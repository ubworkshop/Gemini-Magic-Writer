import { AppSettings } from "./types";

export const APP_NAME = "Gemini Magic Writer";
export const PLACEHOLDER_TEXT = "Start writing or press the sparkles icon to generate a draft...";

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'google',
  model: 'gemini-2.5-flash', // Changed default to Flash for stability
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
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast & Stable)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Reasoning)' },
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
    id: 'nyt',
    label: 'The NY Times Style',
    description: 'Journalistic, narrative & sophisticated',
    prompt: 'Write a comprehensive article about [TOPIC] in the style of The New York Times. Use a sophisticated, journalistic tone with a strong narrative hook. Focus on nuance, multiple perspectives, and evocative descriptions. Maintain high editorial standards.',
    icon: 'Newspaper'
  },
  {
    id: 'economist',
    label: 'The Economist Style',
    description: 'Witty, concise & authoritative',
    prompt: 'Write an article about [TOPIC] in the style of The Economist. Use a witty, dry, and authoritative tone. Be concise, data-driven, and focus on global political/economic implications. Use the editorial "we" where appropriate.',
    icon: 'Globe'
  },
  {
    id: 'wired',
    label: 'Wired Magazine Style',
    description: 'Tech-forward, curious & edgy',
    prompt: 'Write a feature story about [TOPIC] in the style of Wired. Focus on the intersection of technology, culture, and science. Use a futuristic, curious, and slightly edgy tone. Dive deep into the technical "how" and the cultural "why".',
    icon: 'Cpu'
  },
  {
    id: 'atlantic',
    label: 'The Atlantic Style',
    description: 'Deep cultural analysis & long-form',
    prompt: 'Write a thought-provoking essay about [TOPIC] in the style of The Atlantic. Focus on deep cultural analysis, historical context, and a strong, well-argued thesis. Use intellectual but accessible language.',
    icon: 'BookOpen'
  },
  {
    id: 'screenplay',
    label: 'Screenplay / Script',
    description: 'Dialogue, scene headings & action',
    prompt: 'Write a scene for a screenplay about [TOPIC]. Use standard screenplay formatting (Scene Headings, Action Lines, Character Names centered, Dialogue). Include vivid visual descriptions and natural dialogue.',
    icon: 'Film'
  },
  {
    id: 'poem',
    label: 'Poetry',
    description: 'Verses, imagery & rhythm',
    prompt: 'Write a poem about [TOPIC]. Focus on vivid imagery, rhythm, and emotional resonance. Structure it in stanzas.',
    icon: 'Feather'
  },
  {
    id: 'tech_doc',
    label: 'Technical Docs',
    description: 'API specs, guides & code examples',
    prompt: 'Write technical documentation for [TOPIC]. Include an Overview, Prerequisites, Step-by-Step Installation/Usage guide, and Code Examples. Use a clear, objective, and technical tone.',
    icon: 'Terminal'
  },
  {
    id: 'blog',
    label: 'Standard Blog Post',
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
    label: 'Summarize Document',
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