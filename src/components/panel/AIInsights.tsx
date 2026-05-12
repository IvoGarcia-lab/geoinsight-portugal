'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMapStore } from '@/store/useMapStore';
import AIAdvancedChart from './AIAdvancedChart';

export default function AIInsights() {
  const { selectedRegion, setOverlayMode, setSecondaryIndicator, setActiveIndicator } = useMapStore();
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [streamingRegion, setStreamingRegion] = useState<string | null>(null);
  
  // Parsed AI data
  const [aiData, setAiData] = useState<any>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedRegion) return;

    setLoading(true);
    setAnalysis('');
    setAiData(null);
    setHasAnalyzed(true);
    setStreamingRegion(selectedRegion);

    try {
      const res = await fetch(`/api/analyze/${selectedRegion}`);
      if (!res.ok) throw new Error('Analysis failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setAnalysis(fullText);
      }
      
      // Parse JSON when stream finishes
      extractAndExecuteJSON(fullText);
      
    } catch (err) {
      console.error('AI analysis error:', err);
      setAnalysis('⚠️ Erro ao gerar análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, setOverlayMode, setSecondaryIndicator, setActiveIndicator]);

  const extractAndExecuteJSON = (text: string) => {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        setAiData(data);
        
        // Execute Map Actions
        if (data.mapActions && Array.isArray(data.mapActions)) {
          data.mapActions.forEach((action: any) => {
            if (action.action === 'setOverlayMode' && action.value) {
              setOverlayMode(action.value);
            }
            if (action.action === 'setPrimaryIndicator' && action.value) {
              // Note: the store uses setActiveIndicator for the primary one in choropleth
              setActiveIndicator(action.value);
            }
            if (action.action === 'setSecondaryIndicator' && action.value) {
              setSecondaryIndicator(action.value);
            }
          });
        }
      } catch (e) {
        console.error('Failed to parse AI JSON block', e);
      }
    }
  };

  // Reset when region changes
  if (selectedRegion !== streamingRegion && hasAnalyzed) {
    setHasAnalyzed(false);
    setAnalysis('');
    setAiData(null);
    setStreamingRegion(null);
  }

  // Filter out the JSON block for the markdown renderer
  const displayMarkdown = analysis.replace(/```json\n[\s\S]*?\n```/g, '');

  return (
    <div className="ai-insights">
      <div className="ai-header">
        <div className="ai-title-row">
          <span className="ai-icon">🧠</span>
          <h3 className="section-title">Análise AI</h3>
        </div>
        <button
          className={`ai-trigger ${loading ? 'loading' : ''}`}
          onClick={runAnalysis}
          disabled={loading || !selectedRegion}
        >
          {loading ? (
            <>
              <span className="ai-spinner" />
              A analisar...
            </>
          ) : hasAnalyzed ? (
            '↻ Regenerar'
          ) : (
            '▶ Analisar região'
          )}
        </button>
      </div>

      {!hasAnalyzed && !loading && (
        <p className="ai-hint">
          Clica em &quot;Analisar região&quot; para gerar insights automáticos com AI e visualizações avançadas.
        </p>
      )}

      {(loading || hasAnalyzed) && analysis && (
        <div className={`ai-content ${loading ? 'streaming' : ''}`}>
          <MarkdownRenderer text={displayMarkdown} />
          {loading && <span className="ai-cursor">▊</span>}
          
          {aiData?.chartData && !loading && (
            <AIAdvancedChart config={aiData.chartData} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal markdown renderer for AI output
 */
function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="md-content">
      {lines.map((line, i) => {
        // Headings
        if (line.startsWith('### ')) {
          return <h4 key={i} className="md-h3">{line.slice(4)}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="md-h2">{line.slice(3)}</h3>;
        }
        // Bullets
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="md-bullet">
              <span className="md-bullet-dot">·</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: inlineFormat(line.slice(2)),
                }}
              />
            </div>
          );
        }
        // Horizontal rule
        if (line.trim() === '---') {
          return <hr key={i} className="md-hr" />;
        }
        // Italic/muted
        if (line.startsWith('*') && line.endsWith('*')) {
          return <p key={i} className="md-muted">{line.slice(1, -1)}</p>;
        }
        // Empty line
        if (line.trim() === '') {
          return <div key={i} className="md-spacer" />;
        }
        // Regular paragraph
        return (
          <p
            key={i}
            className="md-para"
            dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
          />
        );
      })}
    </div>
  );
}

function inlineFormat(text: string): string {
  // Bold
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');
  // Links
  result = result.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  return result;
}
