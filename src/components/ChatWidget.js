import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { chatAPI, aiAPI } from '../api';
import { selectUser } from '../redux/store';

const s = {
  fab: { position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: '50%', background: '#e94560', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  window: { position: 'fixed', bottom: '90px', right: '24px', width: '340px', height: '480px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden' },
  header: { background: '#1a1a2e', color: '#fff', padding: '14px 16px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tabs: { display: 'flex', borderBottom: '1px solid #eee' },
  tab: (active) => ({ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '700' : '400', background: active ? '#f8f8f8' : '#fff', borderBottom: active ? '2px solid #e94560' : 'none' }),
  messages: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  bubbleUser: { alignSelf: 'flex-end', background: '#e94560', color: '#fff', padding: '8px 12px', borderRadius: '14px 14px 2px 14px', maxWidth: '80%', fontSize: '14px' },
  bubbleBot: { alignSelf: 'flex-start', background: '#f0f0f0', color: '#333', padding: '8px 12px', borderRadius: '14px 14px 14px 2px', maxWidth: '80%', fontSize: '14px' },
  inputRow: { display: 'flex', padding: '10px', borderTop: '1px solid #eee', gap: '8px' },
  input: { flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  sendBtn: { background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '14px' },
};

export default function ChatWidget() {
  const user = useSelector(selectUser);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('support'); // 'support' | 'orders'
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! 👋 I\'m your ShopEase assistant. Ask me anything about products, orders, or shipping!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setMessages([
      { sender: 'bot', text: newMode === 'orders'
        ? 'Ask me about your orders! e.g. "What\'s the status of my last order?"'
        : 'Hi! 👋 I\'m your ShopEase assistant. Ask me anything about products, orders, or shipping!' }
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'orders') {
        if (!user) {
          setMessages(prev => [...prev, { sender: 'bot', text: 'Please log in to ask about your orders.' }]);
          setLoading(false);
          return;
        }
        const { data } = await aiAPI.askOrderAssistant(userMsg);
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        const { data } = await chatAPI.sendMessage(userMsg);
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      {open && (
        <div style={s.window}>
          <div style={s.header}>
            <span>💬 ShopEase Assistant</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>
          <div style={s.tabs}>
            <div style={s.tab(mode === 'support')} onClick={() => switchMode('support')}>💁 General Help</div>
            <div style={s.tab(mode === 'orders')} onClick={() => switchMode('orders')}>📦 My Orders</div>
          </div>
          <div style={s.messages}>
            {messages.map((msg, i) => (
              <div key={i} style={msg.sender === 'user' ? s.bubbleUser : s.bubbleBot}>
                {msg.text}
              </div>
            ))}
            {loading && <div style={s.bubbleBot}>Typing...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={s.inputRow}>
            <input
              style={s.input}
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button style={s.sendBtn} onClick={sendMessage}>➤</button>
          </div>
        </div>
      )}
      <button style={s.fab} onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
    </>
  );
}