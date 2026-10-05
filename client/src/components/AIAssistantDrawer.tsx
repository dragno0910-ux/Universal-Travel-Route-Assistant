import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Shield,
  Ticket,
  Luggage,
  ArrowRight
} from 'lucide-react';
import { RouteOption, TravelPreferences, AIIntentExtractionResult, AIExplanationResult } from '../types/shared';
import { api } from '../services/api';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  activeRoute?: RouteOption | null;
  onClose: () => void;
  onApplyPreferences: (prefs: TravelPreferences, originQuery?: string, destQuery?: string) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  activeRoute,
  onClose,
  onApplyPreferences
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedIntent, setExtractedIntent] = useState<AIIntentExtractionResult | null>(null);
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Namaste! I am your AI Mumbai Travel Assistant. Type natural constraints like "I have 2 suitcases and ₹250 budget to reach Gateway" or ask about ticketing, UTS app, safety, and metro lines.'
    }
  ]);

  if (!isOpen) return null;

  // Handle Intent Extraction from Natural Language
  const handleExtractIntent = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setPrompt('');
    setIsLoading(true);

    setChatHistory((prev) => [...prev, { role: 'user', text: userMsg }]);

    try {
      // 1. Extract constraints
      const intentRes = await api.extractIntent(userMsg);
      setExtractedIntent(intentRes);

      // 2. Chat reply
      const reply = await api.chatAssistant(userMsg, activeRoute || undefined);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I encountered an issue processing that. Please try again!' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick FAQ Prompts
  const handleQuickPrompt = async (question: string) => {
    setChatHistory((prev) => [...prev, { role: 'user', text: question }]);
    setIsLoading(true);
    try {
      const reply = await api.chatAssistant(question, activeRoute || undefined);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '440px',
      background: '#ffffff',
      boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
      zIndex: 2500,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '1.15rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={20} />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>AI Travel Guide</h2>
            <p style={{ fontSize: '0.72rem', opacity: 0.9 }}>
              Natural language intent & local life guidance
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Extracted Intent Banner (If applicable) */}
      {extractedIntent && (
        <div style={{
          padding: '0.85rem 1rem',
          background: '#f0fdf4',
          borderBottom: '1px solid #bbf7d0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
              🎯 Extracted Route Preferences
            </span>
            <button
              onClick={() => {
                onApplyPreferences(
                  extractedIntent.extractedPreferences,
                  extractedIntent.originQuery,
                  extractedIntent.destinationQuery
                );
                onClose();
              }}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.35rem',
                padding: '0.25rem 0.6rem',
                cursor: 'pointer'
              }}
            >
              Apply to Search →
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#14532d', lineHeight: 1.4 }}>
            {extractedIntent.originQuery && <span>From: <b>{extractedIntent.originQuery}</b> </span>}
            {extractedIntent.destinationQuery && <span>To: <b>{extractedIntent.destinationQuery}</b> </span>}
            {extractedIntent.extractedPreferences.maxBudgetINR && (
              <span>• Budget: <b>₹{extractedIntent.extractedPreferences.maxBudgetINR}</b> </span>
            )}
            {extractedIntent.extractedPreferences.luggageFriendly && <span>• 🧳 Luggage-Friendly </span>}
            {extractedIntent.extractedPreferences.priority && (
              <span>• Priority: <b>{extractedIntent.extractedPreferences.priority}</b></span>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {chatHistory.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              background: msg.role === 'user' ? '#2563eb' : '#f8fafc',
              color: msg.role === 'user' ? '#ffffff' : '#0f172a',
              border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '0.85rem',
              padding: '0.75rem 0.95rem',
              fontSize: '0.84rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div style={{
            alignSelf: 'flex-start',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.85rem',
            padding: '0.65rem 0.9rem',
            fontSize: '0.82rem',
            color: '#64748b'
          }}>
            Thinking...
          </div>
        )}
      </div>

      {/* Quick Question Chips */}
      <div style={{ padding: '0.5rem 1rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          Quick Life Questions
        </p>
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {[
            'How to buy UTS ticket?',
            'Luggage on Metro?',
            'Auto rickshaw tariff?',
            'Is it safe at night?'
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(q)}
              style={{
                fontSize: '0.72rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '9999px',
                padding: '0.3rem 0.6rem',
                color: '#334155',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="e.g. 2 suitcases, ₹200 budget to Gateway..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleExtractIntent();
          }}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: '0.65rem',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button
          onClick={handleExtractIntent}
          disabled={isLoading || !prompt.trim()}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.65rem',
            padding: '0.65rem 0.95rem',
            cursor: !prompt.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
