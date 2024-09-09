import React, { useState, useRef, useEffect } from 'react';
import { Message, UserMemories, pickImage, getBotResponse, getOrCreateSessionId, getUserMemories, updateUserMemories, resetConversation } from '../utils/chatUtils';
import { ChatSidebar } from './ChatSidebar';

interface ChatHistory {
  id: string;
  messages: Message[];
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [userMemories, setUserMemories] = useState<UserMemories>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setShowScrollToTop(scrollTop > 300);
  };

  const scrollToTop = () => {
    messagesEndRef.current?.parentElement?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSend = async () => {
    if (input.trim() || previewImage) {
      const newMessage: Message = {
        text: input,
        sender: 'user',
        image: previewImage || undefined,
      };
      setMessages([...messages, newMessage]);
      setIsLoading(true);

      const sessionId = await getOrCreateSessionId();
      const currentUserMessages = getUserMemories(sessionId, userMemories);

      const apiMessages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...currentUserMessages,
        { role: 'user', content: input }
      ];

      if (previewImage) {
        apiMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: 'Here is an image:' },
            { type: 'image_url', image_url: { url: previewImage } }
          ]
        });
      }

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const botResponse = await getBotResponse(apiMessages, apiKey);

      const botMessage: Message = {
        text: botResponse,
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

      updateUserMemories(sessionId, userMemories, [
        { role: 'user', content: input },
        { role: 'assistant', content: botResponse }
      ]);
      setUserMemories({ ...userMemories });

      setInput('');
      setPreviewImage(null);
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    const imageDataUrl = await pickImage();
    if (imageDataUrl) {
      setPreviewImage(imageDataUrl);
    }
  };

  const handleResetConversation = async () => {
    if (messages.length > 0) {
      const newHistory: ChatHistory = {
        id: Date.now().toString(),
        messages: [...messages],
      };
      setChatHistory(prevHistory => {
        const updatedHistory = [newHistory, ...prevHistory].slice(0, 25);
        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }
    const newSessionId = await resetConversation(userMemories);
    setUserMemories({ ...userMemories });
    setMessages([]);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const selectChat = (selectedMessages: Message[]) => {
    setMessages(selectedMessages);
    setIsSidebarOpen(false);
  };

  return (
    <div className={`chat-app ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <button onClick={toggleSidebar} className="toggle-sidebar-button" aria-label="Toggle sidebar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
      <header className="chat-header">
        <div></div>
        <button onClick={handleResetConversation} className="reset-button">Reset Chat</button>
      </header>
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={chatHistory}
        onClearHistory={clearChatHistory}
        onSelectChat={selectChat}
      />
      <main className="chat-container" onScroll={handleScroll}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.image && <img src={message.image} alt="Uploaded" className="uploaded-image" />}
            <p>{message.text}</p>
          </div>
        ))}
        {isLoading && <div className="message bot loading">Thinking...</div>}
        <div ref={messagesEndRef} />
        {showScrollToTop && (
          <button className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
            ↑
          </button>
        )}
      </main>
      <footer className="input-container">
        {previewImage && (
          <div className="preview-image-container">
            <img src={previewImage} alt="Preview" className="preview-image" />
            <button onClick={() => setPreviewImage(null)} className="remove-image-button">×</button>
          </div>
        )}
        <div className="input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleImageUpload} className="upload-button" aria-label="Upload image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </button>
          <button onClick={handleSend} disabled={isLoading}>
            <span className="send-button-text">Send</span>
            <span className="send-button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};