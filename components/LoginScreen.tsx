import React, { useState } from 'react';
import { Lock, Truck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('leonardoassunccao@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Default credentials
  const DEFAULT_EMAIL = 'leonardoassunccao@gmail.com';
  const DEFAULT_PASS = 'Leo367642';
  const PROFILE_STORAGE_KEY = 'romaneios_user_profile_v1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get persisted password if any
    let validPass = DEFAULT_PASS;
    try {
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.password) validPass = parsed.password;
      }
    } catch (e) { console.error(e); }

    // UX Simulation
    setTimeout(() => {
      if (email === DEFAULT_EMAIL && password === validPass) {
        onLogin(email);
      } else {
        setError('Email ou senha incorretos.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkbg p-4">
      <div className="w-full max-w-md bg-white dark:bg-carddark rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30">
            <Truck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LogiCheck</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="Sua senha"
            />
          </div>

          <div className="text-xs text-center text-gray-400">
             (MVP) Senha Padrão: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{DEFAULT_PASS}</span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
              <Lock size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;