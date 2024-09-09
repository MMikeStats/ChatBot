import React from 'react';

interface ChatHistory {
  id: string;
  messages: { text: string; sender: 'user' | 'bot' }[];
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatHistory[];
  onClearHistory: () => void;
  onSelectChat: (messages: ChatHistory['messages']) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose, history, onClearHistory, onSelectChat }) => {
  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      <button className="close-sidebar" onClick={onClose}>×</button>
      <h2>Chat History</h2>
      <div className="history-list">
        {history.map((chat) => (
          <div key={chat.id} className="history-item" onClick={() => onSelectChat(chat.messages)}>
            <p>{chat.messages[0].text.substring(0, 30)}...</p>
          </div>
        ))}
      </div>
      <button className="clear-history" onClick={onClearHistory}>Clear History</button>
    </div>
  );
};