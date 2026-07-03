const axios = require('axios');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-70b-versatile';

async function generateTaskBreakdown(prompt) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error('GROQ_API_KEY is not configured');
    error.status = 500;
    throw error;
  }

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Return only valid JSON. The JSON must be an array of objects with title and description string fields. No markdown, no code fences, no commentary.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content) {
      const error = new Error('Groq returned an empty response');
      error.status = 502;
      throw error;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      const error = new Error('Groq returned malformed JSON');
      error.status = 502;
      throw error;
    }

    if (!Array.isArray(parsed)) {
      const error = new Error('Groq response must be a JSON array');
      error.status = 502;
      throw error;
    }

    return parsed
      .filter((item) => item && typeof item.title === 'string' && typeof item.description === 'string')
      .map((item) => ({
        title: item.title,
        description: item.description,
      }));
  } catch (error) {
    if (error.response?.status === 429) {
      const rateLimitError = new Error('Groq rate limit exceeded');
      rateLimitError.status = 429;
      throw rateLimitError;
    }

    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error('Groq request timed out');
      timeoutError.status = 504;
      throw timeoutError;
    }

    if (error.status) {
      throw error;
    }

    const serviceError = new Error('Groq service unavailable');
    serviceError.status = 502;
    throw serviceError;
  }
}

module.exports = {
  generateTaskBreakdown,
};
