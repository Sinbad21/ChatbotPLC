import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatWidget } from './Widget';
import './index.css';

// Allow widget to be initialized from external scripts
declare global {
  interface Window {
    ChatbotWidget: {
      init: (config: { botId: string; apiUrl?: string }) => void;
    };
  }
}

window.ChatbotWidget = {
  init: ({ botId, apiUrl }) => {
    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    document.body.appendChild(container);

    ReactDOM.createRoot(container).render(
      <React.StrictMode>
        <ChatWidget botId={botId} apiUrl={apiUrl} />
      </React.StrictMode>
    );
  },
};

export { ChatWidget };
