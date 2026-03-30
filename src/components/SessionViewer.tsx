'use client';

import { useEffect, useRef } from 'react';

interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SessionViewerProps {
  transcript: TranscriptMessage[];
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function SessionViewer({ transcript }: SessionViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-500">No transcript available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      <div
        ref={scrollRef}
        className="max-h-[600px] space-y-4 overflow-y-auto p-6"
      >
        {transcript.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={i}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-br-md bg-indigo-600 text-white'
                      : 'rounded-bl-md bg-gray-800 text-gray-200'
                  }`}
                  style={isUser ? { backgroundColor: '#4f46e5' } : undefined}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p
                  className={`mt-1 text-xs text-gray-500 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
