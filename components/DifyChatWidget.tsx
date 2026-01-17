'use client';

import { useState } from 'react';

export default function DifyChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const chatUrl = 'https://udify.app/chat/lnSWyiBpBRgI9fzE';

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '50px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          fontSize: '16px',
          fontWeight: 600,
          zIndex: 9999
        }}
      >
        💬 Tư vấn AI
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '400px',
            height: '600px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 9999,
            background: 'white'
          }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600 }}>JFinder AI Assistant</span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            <iframe
              src={chatUrl}
              style={{
                width: '100%',
                height: 'calc(100% - 62px)',
                border: 'none'
              }}
              title="Dify Chatbot"
            />
          </div>
        </>
      )}
    </>
  );
}
