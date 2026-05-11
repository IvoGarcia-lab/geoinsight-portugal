'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export default function UserAccount() {
  const { user, signOut, loading } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Verifique o seu email para confirmar o registo!');
      }
      setShowModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Erro na autenticação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="user-skeleton animate-pulse" />;

  if (user) {
    return (
      <div className="user-profile">
        <div className="user-avatar">
          {user.email?.[0].toUpperCase()}
        </div>
        <div className="user-info">
          <span className="user-email">{user.email}</span>
          <button onClick={signOut} className="btn-signout">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="btn-login"
      >
        Entrar
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{authMode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAuth} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="exemplo@email.com"
                />
              </div>
              <div className="form-group">
                <label>Palavra-passe</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                />
              </div>

              {authError && <div className="auth-error">{authError}</div>}

              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'A processar...' : (authMode === 'login' ? 'Entrar' : 'Registar')}
              </button>

              <div className="auth-switch">
                {authMode === 'login' ? (
                  <>Não tem conta? <button type="button" onClick={() => setAuthMode('signup')}>Registe-se</button></>
                ) : (
                  <>Já tem conta? <button type="button" onClick={() => setAuthMode('login')}>Inicie sessão</button></>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
