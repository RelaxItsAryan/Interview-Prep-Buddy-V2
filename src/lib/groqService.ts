const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface GeneratedQuestion {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EvaluationResult {
  feedback: string;
  strongAnswer: string;
  missingElements: string[];
}

export const getGroqApiKey = (): string | null => {
  return import.meta.env.VITE_GROQ_API_KEY || null;
};

export const isGroqConfigured = (): boolean => {
  const key = getGroqApiKey();
  return !!key && key !== 'your_groq_api_key_here';
};

export const generateInterviewQuestions = async (
  role: string,
  count: number = 8
): Promise<GeneratedQuestion[]> => {
  const apiKey = getGroqApiKey();
  
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API key not configured.');
  }

  const systemPrompt = `You are an expert technical interviewer. Generate interview questions for a ${role} position.

You MUST respond with ONLY valid JSON array (no markdown, no code blocks):
[
  {
    "id": "<unique-id>",
    "text": "<interview question>",
    "category": "<category like Technical, Behavioral, Problem Solving, etc>",
    "difficulty": "<easy|medium|hard>"
  }
]

Generate ${count} diverse questions covering:
- Technical skills specific to the role
- Problem-solving scenarios
- Behavioral/situational questions
- Past experience questions

Make questions realistic and commonly asked in real interviews.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${count} interview questions for a ${role} position.` }
      ],
      temperature: 0.8,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Groq API');
  }

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.map((q: any, index: number) => ({
      id: q.id || `q-${index + 1}`,
      text: String(q.text || 'Tell me about yourself.'),
      category: String(q.category || 'General'),
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    })) : [];
  } catch (parseError) {
    console.error('Failed to parse questions:', content);
    throw new Error('Failed to generate questions');
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const apiKey = getGroqApiKey();
  
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API key not configured.');
  }

  const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });
  
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'en');

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Transcription error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
};

export const evaluateAnswer = async (
  question: string,
  answer: string,
  role: string,
  category: string
): Promise<EvaluationResult> => {
  const apiKey = getGroqApiKey();
  
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API key not configured.');
  }

  const systemPrompt = `You are an expert technical interviewer evaluating candidate responses for a ${role} position.
Analyze the candidate's answer and provide feedback.

You MUST respond with ONLY valid JSON (no markdown, no code blocks):
{
  "feedback": "<string: 2-3 sentence feedback on how an interviewer would perceive this answer and what could be improved>",
  "strongAnswer": "<string: what a strong candidate answer would look like for this question>",
  "missingElements": ["<string>", "<string>", ...] (max 4 key elements that were missing from the answer)
}`;

  const userPrompt = `Question Category: ${category}
Interview Question: ${question}

Candidate's Answer: ${answer}

Evaluate this response and provide detailed feedback.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Groq API');
  }

  try {
    const parsed = JSON.parse(content);
    
    return {
      feedback: String(parsed.feedback || 'Unable to generate feedback.'),
      strongAnswer: String(parsed.strongAnswer || 'A strong answer would include specific examples.'),
      missingElements: Array.isArray(parsed.missingElements) 
        ? parsed.missingElements.slice(0, 4).map(String)
        : ['Specific examples', 'Technical depth'],
    };
  } catch (parseError) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Failed to parse evaluation response');
  }
};
