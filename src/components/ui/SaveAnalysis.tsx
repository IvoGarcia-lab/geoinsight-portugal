'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMapStore } from '@/store/useMapStore';
import { supabase } from '@/lib/supabase';

export default function SaveAnalysis() {
  const { user, session } = useAuthStore();
  const { activeIndicator, secondaryIndicator, scaleType, overlayMode, activeYear } = useMapStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [title, setTitle] = useState('');

  const handleSave = async () => {
    if (!user || !session) return;
    setIsSaving(true);

    try {
      const response = await fetch('/api/analysis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: title || `Análise ${activeIndicator}`,
          primaryIndicator: activeIndicator,
          secondaryIndicator,
          scaleType,
          overlayMode,
          year: activeYear
        })
      });

      if (!response.ok) throw new Error('Falha ao guardar análise');
      
      alert('Análise guardada com sucesso!');
      setShowTitleInput(false);
      setTitle('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="save-analysis-container">
      {!showTitleInput ? (
        <button 
          onClick={() => setShowTitleInput(true)}
          className="btn-save-trigger"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Guardar Análise
        </button>
      ) : (
        <div className="save-input-group">
          <input 
            type="text" 
            placeholder="Nome da análise..." 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="save-input"
            autoFocus
          />
          <button onClick={handleSave} disabled={isSaving} className="btn-save-confirm">
            {isSaving ? '...' : 'OK'}
          </button>
          <button onClick={() => setShowTitleInput(false)} className="btn-save-cancel">&times;</button>
        </div>
      )}
    </div>
  );
}
