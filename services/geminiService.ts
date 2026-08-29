import { safeFetchJson } from '../utils/api.js';

export const sendMessageToGemini = async (history: {role: string, text: string}[], newMessage: string): Promise<string> => {
  try {
    const res = await safeFetchJson<{ text?: string; error?: string }>('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history,
        message: newMessage
      })
    });

    if (res.ok && res.data?.text) {
      return res.data.text;
    }
    
    if (res.error || res.data?.error) {
      throw new Error(res.error || res.data?.error);
    }
    
    return "I am temporarily unable to get a response from the server.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return error.message || "Error connecting to AI advisor. Please check if the GEMINI_API_KEY is configured on the server.";
  }
};
