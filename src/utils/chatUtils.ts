import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'https://api.openai.com/v1/chat/completions';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  image?: string;
}

export interface UserMemories {
  [sessionId: string]: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
}

export const pickImage = async (): Promise<string> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    };
    input.click();
  });
};

export const getBotResponse = async (
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  apiKey: string
): Promise<string> => {
  try {
    const response = await axios.post(API_URL, {
      model: "chatgpt-4o-latest",
      messages: messages,
      max_tokens: 500
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "I'm sorry, I'm having trouble processing your request right now.";
  }
};

export const getOrCreateSessionId = async (): Promise<string> => {
  let sessionId = await AsyncStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = uuidv4();
    await AsyncStorage.setItem('sessionId', sessionId as string);
  }
  return sessionId || ''; // This will return an empty string instead of null
};

export const getUserMemories = (sessionId: string, userMemories: UserMemories) => {
  return userMemories[sessionId] || [];
};

export const updateUserMemories = (sessionId: string, userMemories: UserMemories, newMessages: Array<{ role: string; content: string }>) => {
  userMemories[sessionId] = [...(userMemories[sessionId] || []), ...newMessages];
};

export const resetConversation = async (userMemories: UserMemories) => {
  const sessionId = await getOrCreateSessionId();
  userMemories[sessionId] = [];
  return sessionId;
};