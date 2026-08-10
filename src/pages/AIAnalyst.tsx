import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { AppLayout } from '../components/layout/AppLayout';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { PageSkeleton } from '../components/ui/LoadingStates';
import { EmptyState } from '../components/ui/EmptyState';
import { Bot, Send, Sparkles, TrendingUp, Lightbulb, Loader2, History, Info } from 'lucide-react';
import type { AIConversation } from '../types';
import { generateAIResponse } from '../services/aiService';
import { v4 as uuid } from 'uuid';

function suggestQuestions(data: Record<string, unknown>[]): string[] {
  if (!data.length) return [];
  const keys = Object.keys(data[0]);
  const numericKeys = keys.filter(k => typeof data[0][k] === 'number');
  const catKeys = keys.filter(k => typeof data[0][k] === 'string');
  const qs: string[] = [];
  if (numericKeys.length >= 2) qs.push(`What's the relationship between ${numericKeys[0]} and ${numericKeys[1]}?`);
  if (numericKeys.length) qs.push(`What is the average ${numericKeys[0]}?`);
  if (catKeys.length && numericKeys.length) qs.push(`Which ${catKeys[0]} has the highest ${numericKeys[0]}?`);
  if (numericKeys.length) qs.push(`Show me the trend of ${numericKeys[0]}`);
  return qs.slice(0, 4);
}

export default function AIAnalyst() {
  const { activeDataset, conversations, addConversation, isLoading } = useDataset();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AIConversation | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) return <AppLayout onUploadClick={() => navigate('/datasets')}><PageSkeleton /></AppLayout>;
  if (!activeDataset) return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <EmptyState icon="data" title="No Dataset Selected" description="Select a dataset to start asking questions." action={{ label: 'Go to Datasets', onClick: () => navigate('/datasets') }} />
    </AppLayout>
  );

  const suggestions = suggestQuestions(activeDataset.data);

  const handleAsk = (question?: string) => {
    const q = (question || query).trim();
    if (!q) return;
    setIsThinking(true);
    setCurrentAnswer(null);
    setQuery('');
    setTimeout(() => {
      try {
        const result = generateAIResponse(q, activeDataset);
        const conv: AIConversation = {
          id: uuid(),
          userId: activeDataset.userId,
          datasetId: activeDataset.id,
          question: q,
          answer: result.answer,
          evidence: result.evidence,
          recommendation: result.recommendation,
          chart: result.chart ? {
            id: uuid(),
            title: result.chart.title,
            type: result.chart.type,
            xKey: 'label',
            yKey: 'value',
            data: result.chart.labels.map((label, i) => ({ label, value: result.chart!.values[i] })),
          } : undefined,
          createdAt: new Date().toISOString(),
        };
        setCurrentAnswer(conv);
        addConversation(conv);
      } catch {
        setCurrentAnswer({
          id: uuid(), userId: activeDataset.userId, datasetId: activeDataset.id,
          question: q, answer: "I couldn't find an answer to that question from your dataset.", evidence: '',
          createdAt: new Date().toISOString(),
        });
      }
      setIsThinking(false);
    }, 800);
  };

  return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot size={24} className="text-primary" /> AI Analyst
            </h1>
            <p className="text-muted-foreground text-sm">Ask questions about {activeDataset.name} in plain English</p>
          </div>
          {conversations.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} className="px-3 py-2 text-sm bg-card border border-card-border rounded-lg hover:border-primary/40 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]">
              <History size={14} /> {showHistory ? 'New Query' : 'History'}
            </button>
          )}
        </div>

        {!showHistory ? (
          <>
            {/* Chat Area */}
            <div className="card p-6 mb-4 min-h-[300px]">
              {!currentAnswer && !isThinking && (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Bot size={32} className="text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Ask me anything about your data — trends, comparisons, outliers, or summaries.
                  </p>
                </div>
              )}

              {isThinking && (
                <div className="flex items-center gap-3 p-4 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" /> Analyzing your data...
                  </div>
                </div>
              )}

              {currentAnswer && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">You</div>
                    <div className="bg-muted/30 rounded-xl rounded-tl-none px-4 py-2.5 text-sm max-w-[80%]">
                      {currentAnswer.question}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-xl rounded-tl-none px-4 py-2.5 text-sm max-w-[85%]">
                      <p className="mb-2">{currentAnswer.answer}</p>
                      {currentAnswer.evidence && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-2 p-2 bg-muted/20 rounded-lg">
                          <Info size={12} className="mt-0.5 shrink-0 text-primary" />
                          <span>{currentAnswer.evidence}</span>
                        </div>
                      )}
                      {currentAnswer.recommendation && (
                        <div className="flex items-start gap-1.5 text-xs mt-2 p-2 bg-accent/10 rounded-lg">
                          <Lightbulb size={12} className="mt-0.5 shrink-0 text-accent" />
                          <span>{currentAnswer.recommendation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {currentAnswer.chart && (
                    <div className="ml-11 card p-3">
                      <h4 className="text-xs font-semibold mb-2">{currentAnswer.chart.title}</h4>
                      <ChartRenderer config={currentAnswer.chart} height={220} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !currentAnswer && !isThinking && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Lightbulb size={12} /> Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleAsk(s)} className="px-3 py-1.5 text-xs bg-card border border-card-border rounded-full hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask a question about your data..."
                  className="input pr-12 w-full"
                  disabled={isThinking}
                />
              </div>
              <button
                onClick={() => handleAsk()}
                disabled={!query.trim() || isThinking}
                className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all disabled:opacity-40 cursor-pointer active:scale-[0.97]"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          /* Conversation History */
          <div className="space-y-2">
            {[...conversations].reverse().map((conv, i) => (
              <div key={conv.id} className="card p-4 hover:translate-y-[-1px] cursor-pointer transition-all" onClick={() => { setCurrentAnswer(conv); setShowHistory(false); }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{conv.question}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{conv.answer}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-4 whitespace-nowrap">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}