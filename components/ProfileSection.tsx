import React, { useState, useRef } from 'react';
import { Camera, Save, User, Mail, CheckCircle2, Key, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, onSave }) => {
  const [name, setName] = useState(profile.name);
  const [photo, setPhoto] = useState<string | null>(profile.photo);
  const [savedStatus, setSavedStatus] = useState(false);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setPassError('');
    
    // Logic for password update if any field is filled
    let finalPassword = profile.password;
    if (currentPassword || newPassword || confirmPassword) {
      if (currentPassword !== profile.password) {
        setPassError('A senha atual está incorreta.');
        return;
      }
      if (newPassword.length < 4) {
        setPassError('A nova senha deve ter pelo menos 4 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPassError('As novas senhas não coincidem.');
        return;
      }
      finalPassword = newPassword;
    }

    onSave({
      ...profile,
      name,
      photo,
      password: finalPassword
    });

    setSavedStatus(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-carddark rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        <div className="px-8 pb-8">
          {/* Photo Avatar */}
          <div className="relative -mt-16 mb-6 flex justify-center sm:justify-start">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-carddark bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-lg flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-gray-400" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-md hover:bg-blue-700 transition-all"
                title="Alterar foto"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações de Perfil</h2>
              <p className="text-sm text-gray-500">Gerencie suas informações pessoais e segurança.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Email (Read Only) */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <Mail size={14} /> E-mail da Conta
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
                  {profile.email}
                </div>
              </div>

              {/* Name (Editable) */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <User size={14} /> Nome Completo
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                  placeholder="Seu nome"
                />
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                  <Key size={16} className="text-primary" />
                  SEGURANÇA E ACESSO
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 relative">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">SENHA ATUAL</label>
                    <input 
                      type={showPass ? "text" : "password"} 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">NOVA SENHA</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="Nova senha"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">CONFIRMAR NOVA SENHA</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="Confirme"
                    />
                  </div>
                </div>
                {passError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-medium animate-in fade-in">
                    <AlertCircle size={14} /> {passError}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              {savedStatus && (
                <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm animate-in slide-in-from-left-2">
                  <CheckCircle2 size={18} /> Perfil atualizado!
                </div>
              )}
              <div className="flex-1"></div>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                <Save size={18} /> Salvar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>Aviso:</strong> A troca de senha é armazenada localmente. Caso utilize outro dispositivo ou limpe o navegador, a senha voltará ao padrão do sistema.
        </p>
      </div>
    </div>
  );
};

export default ProfileSection;