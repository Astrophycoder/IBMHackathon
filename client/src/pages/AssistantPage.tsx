import React, { useState, useRef, useEffect } from 'react';
import { sendAssistantMessage, draftListing } from '../api/client';
import { AssistantResponse, Opportunity } from '../types/domain';
import styles from './AssistantPage.module.css';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  response?: AssistantResponse;
}

function OpportunityMini({ opp }: { opp: Opportunity }) {
  return (
    <div className={styles.miniCard}>
      <div className={styles.miniTitle}>{opp.title}</div>
      <div className={styles.miniMeta}>
        <span className="badge badge--teal">{opp.type}</span>
        {opp.isPaid && <span className="badge badge--green">Paid</span>}
        {opp.remoteMode && <span className="badge badge--grey">{opp.remoteMode}</span>}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages]   = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hi! Describe what you\'re looking for and I\'ll find matching opportunities. For example: "I\'m looking for remote React developer work" or "I want to volunteer for animal welfare in Mumbai".',
    },
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [draftMode, setDraftMode] = useState(false);
  const [draft, setDraft]         = useState<string | null>(null);
  const [draftInput, setDraftInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const response = await sendAssistantMessage(text);
      const isAI = response.mode === 'ai-assisted';
      const count = response.results.items.length;

      let replyText = isAI
        ? `[AI-assisted] Found ${count} result${count !== 1 ? 's' : ''}.`
        : `Found ${count} result${count !== 1 ? 's' : ''} (search mode — no AI model configured).`;

      if (response.results.suggestion) {
        replyText += ` Skill suggestion: "${response.results.suggestion}".`;
      }

      setMessages(prev => [...prev, { role: 'assistant', text: replyText, response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I could not process your request. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDraft() {
    const text = draftInput.trim();
    if (!text || loading) return;
    setLoading(true);
    try {
      const result = await draftListing(text);
      if (result.fallback) {
        setDraft(null);
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'No AI model is configured. Use the opportunity posting form to create your listing manually.',
        }]);
      } else {
        setDraft(result.draft);
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: `AI-generated draft (${result.disclaimer}):`,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Draft generation failed.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>💬 AI Assistant</h1>
          <p className={styles.sub}>
            Describe what you need in plain language.
            Results are matched using search — only labeled "AI-assisted" when a real model is active.
          </p>
        </div>
        <button
          className={['btn', draftMode ? 'btn--primary' : 'btn--ghost'].join(' ')}
          onClick={() => setDraftMode(d => !d)}
          aria-pressed={draftMode}
        >
          {draftMode ? '← Back to Search' : '✍️ Draft a Listing'}
        </button>
      </div>

      {/* Draft mode */}
      {draftMode && (
        <div className={styles.draftPanel}>
          <label htmlFor="draft-input" className={styles.draftLabel}>
            Describe the opportunity you want to post:
          </label>
          <textarea
            id="draft-input"
            value={draftInput}
            onChange={e => setDraftInput(e.target.value)}
            rows={3}
            placeholder="e.g. I need a graphic designer to create posters for my NGO's annual event…"
            className={styles.draftTextarea}
          />
          <button
            className="btn btn--primary"
            onClick={handleDraft}
            disabled={loading || !draftInput.trim()}
          >
            {loading ? 'Generating…' : 'Generate Draft'}
          </button>
          {draft && (
            <div className={styles.draftResult}>
              <p className={styles.draftDisclaimer}>
                ⚠️ AI-generated draft. Review carefully before posting.
              </p>
              <pre className={styles.draftText}>{draft}</pre>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {!draftMode && (
        <>
          <div className={styles.chat} aria-live="polite" aria-label="Conversation">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={[styles.message, msg.role === 'user' ? styles.user : styles.assistant].join(' ')}
              >
                <div className={styles.bubble}>
                  {msg.text}
                  {msg.response?.mode === 'ai-assisted' && (
                    <span className={styles.aiTag}>AI-assisted</span>
                  )}
                </div>

                {/* Inline results */}
                {msg.response && msg.response.results.items.length > 0 && (
                  <div className={styles.inlineResults}>
                    {msg.response.results.items.slice(0, 5).map(opp => (
                      <OpportunityMini key={opp.id} opp={opp} />
                    ))}
                    {msg.response.results.total > 5 && (
                      <p className={styles.moreResults}>
                        +{msg.response.results.total - 5} more →{' '}
                        <a href={`/search?q=${encodeURIComponent(input)}`}>View all in Search</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className={[styles.message, styles.assistant].join(' ')}>
                <div className={[styles.bubble, styles.typing].join(' ')}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            className={styles.inputRow}
            onSubmit={e => { e.preventDefault(); handleSend(); }}
          >
            <label htmlFor="assistant-input" className="sr-only">Your message</label>
            <input
              id="assistant-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe what you're looking for…"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              {loading ? '…' : 'Send'}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
