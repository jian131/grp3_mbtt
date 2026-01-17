'use client';

import { useEffect } from 'react';

interface DifyChatWidgetProps {
  apiKey?: string;
  baseUrl?: string;
}

export default function DifyChatWidget({ apiKey, baseUrl }: DifyChatWidgetProps) {
  useEffect(() => {
    // Skip if no API key provided
    if (!apiKey) {
      console.warn('Dify API key not configured');
      return;
    }

    // Load Dify chatbot script
    const script = document.createElement('script');
    script.src = 'https://udify.app/embed.min.js';
    script.id = 'dify-chatbot-script';
    script.defer = true;

    script.onload = () => {
      // Initialize Dify chatbot
      if (typeof window !== 'undefined' && (window as any).difyChatbotConfig) {
        (window as any).difyChatbotConfig = {
          token: apiKey,
          baseUrl: baseUrl || 'https://api.dify.ai',
          containerProps: {
            style: {
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 9999
            }
          }
        };
      }
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById('dify-chatbot-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [apiKey, baseUrl]);

  return (
    <>
      {/* Dify chatbot will be injected here */}
      {!apiKey && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#1890ff',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            fontWeight: 500
          }}
          onClick={() => {
            alert('Cấu hình Dify API key trong .env.local:\nNEXT_PUBLIC_DIFY_API_KEY=your-key');
          }}
        >
          💬 Tư vấn AI
        </div>
      )}
    </>
  );
}
