import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Moon, Sun, Plus, ClipboardList, LogOut, X, CalendarRange, FileSpreadsheet, FileText, Upload, Download, AlertTriangle, Truck, UserCircle, User, Filter, Search, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import { DayRecord, VehicleRecord, ManualEntry, UserProfile } from './types';
import DaySection from './components/DaySection';
import SummaryChart from './components/SummaryChart';
import ManualIndexSection from './components/ManualIndexSection';
import ProfileSection from './components/ProfileSection';
import ConfirmModal from './components/ConfirmModal';
import LoginScreen from './components/LoginScreen';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const STORAGE_KEY = 'romaneios_data_v1';
const MANUAL_STORAGE_KEY = 'romaneios_manual_index_v1';
const AUTH_KEY = 'romaneios_auth_session';
const PROFILE_STORAGE_KEY = 'romaneios_user_profile_v1';
const DEFAULT_PASS = 'Leo367642';

type Tab = 'general' | 'manual' | 'profile';

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE MANAGEMENT ---
  
  // 1. General Conference Data
  const [days, setDays] = useState<DayRecord[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (e) {
      console.error("Erro ao carregar dados do LocalStorage:", e);
      return [];
    }
  });

  // 2. Manual Index Data
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>(() => {
    try {
      const savedData = localStorage.getItem(MANUAL_STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (e) {
      console.error("Erro ao carregar índice manual:", e);
      return [];
    }
  });

  // 3. User Profile State
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (!parsed.password) parsed.password = DEFAULT_PASS;
        return parsed;
      }
    } catch (e) { console.error(e); }
    return { name: 'Usuário LogiCheck', photo: null, email: '', password: DEFAULT_PASS };
  });

  // UI States
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isDark, setIsDark] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDateInput, setNewDateInput] = useState('');
  
  // Filter & Chart State
  const [showFilters, setShowFilters] = useState(false);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterSearch, setFilterSearch] = useState(''); // Driver or Plate
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  
  // Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECTS ---

  useEffect(() => {
    const savedSession = localStorage.getItem(AUTH_KEY);
    if (savedSession) {
      setIsLoggedIn(true);
      setUserEmail(savedSession);
      // Sync email to profile if not already set
      setProfile(prev => ({ ...prev, email: savedSession }));
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
    setIsLoading(false);

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Persist General Data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  }, [days]);

  // Persist Manual Data
  useEffect(() => {
    localStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(manualEntries));
  }, [manualEntries]);

  // Persist Profile
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile, isLoggedIn]);

  // --- ACTIONS ---

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowInstallBtn(false);
      });
    }
  };

  const handleLogin = (email: string) => {
    localStorage.setItem(AUTH_KEY, email);
    setUserEmail(email);
    setProfile(prev => ({ ...prev, email }));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
    setUserEmail('');
  };

  const handleAddDay = (dateString: string) => {
    if (!dateString) return;
    if (days.find(d => d.date === dateString)) {
      alert("Este dia já está registrado!");
      setShowAddDate(false);
      return;
    }
    const newDay: DayRecord = { date: dateString, records: [] };
    setDays(prev => [newDay, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setShowAddDate(false);
    setNewDateInput('');
    setFilterStart('');
    setFilterEnd('');
    setFilterSearch('');
    setChartPeriod('daily');
  };

  const addVehicle = (date: string, vehicle: Omit<VehicleRecord, 'id' | 'timestamp'>) => {
    setDays(prev => prev.map(day => {
      if (day.date !== date) return day;
      return {
        ...day,
        records: [...day.records, { ...vehicle, id: uuidv4(), timestamp: Date.now() }]
      };
    }));
  };

  const removeVehicle = (date: string, vehicleId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Conferência',
      message: 'Deseja realmente excluir este registro?',
      onConfirm: () => {
        setDays(prev => prev.map(day => {
          if (day.date !== date) return day;
          return { ...day, records: day.records.filter(r => r.id !== vehicleId) };
        }));
        closeConfirmModal();
      }
    });
  };

  const deleteDay = (date: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Dia',
      message: 'Isso apagará toda a conferência deste dia.',
      onConfirm: () => {
        setDays(prev => prev.filter(d => d.date !== date));
        closeConfirmModal();
      }
    });
  };

  const addManualEntry = (entry: Omit<ManualEntry, 'id' | 'timestamp'>) => {
    const newEntry: ManualEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: Date.now()
    };
    setManualEntries(prev => [newEntry, ...prev]);
  };

  const removeManualEntry = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Ocorrência',
      message: 'Deseja remover este registro de índice manual?',
      onConfirm: () => {
        setManualEntries(prev => prev.filter(e => e.id !== id));
        closeConfirmModal();
      }
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const clearFilters = () => {
    setFilterStart('');
    setFilterEnd('');
    setFilterSearch('');
  };

  // --- COMPUTED ---

  const globalStats = useMemo(() => {
    return days.reduce((acc, day) => {
      acc.vehicles += day.records.length;
      acc.invoices += day.records.reduce((sum, r) => sum + r.invoiceCount, 0);
      return acc;
    }, { vehicles: 0, invoices: 0 });
  }, [days]);

  const filteredDays = useMemo(() => {
    let result = days;

    // 1. Filter by Date Range
    if (filterStart) result = result.filter(d => d.date >= filterStart);
    if (filterEnd) result = result.filter(d => d.date <= filterEnd);

    // 2. Filter by Search Text (Deep filter inside records)
    if (filterSearch.trim()) {
      const searchLower = filterSearch.toLowerCase();
      result = result.map(day => ({
        ...day,
        records: day.records.filter(r => 
          r.driver.toLowerCase().includes(searchLower) || 
          r.plate.toLowerCase().includes(searchLower)
        )
      })).filter(day => day.records.length > 0);
    }

    return result;
  }, [days, filterStart, filterEnd, filterSearch]);

  // --- EXPORT/IMPORT ---

  const handleBackup = () => {
    const backupData = {
      days: days,
      manualEntries: manualEntries,
      profile: profile
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_logicheck_FULL_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        let newDays = [];
        let newManual = [];
        let newProfile = profile;

        if (Array.isArray(parsedData)) {
          newDays = parsedData;
        } else {
          newDays = parsedData.days || [];
          newManual = parsedData.manualEntries || [];
          newProfile = parsedData.profile || profile;
        }

        setConfirmModal({
          isOpen: true,
          title: 'Restaurar Backup Completo',
          message: 'Isso substituirá TODOS os dados atuais. Confirmar?',
          onConfirm: () => {
            setDays(newDays);
            setManualEntries(newManual);
            setProfile(newProfile);
            closeConfirmModal();
            alert("Dados restaurados com sucesso!");
          }
        });
      } catch (err) {
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportExcel = () => {
    if (filteredDays.length === 0) return alert("Sem dados para exportar.");
    let csvContent = "Data;Hora;Placa;Motorista;Qtd Notas\n";
    const sortedDays = [...filteredDays].sort((a, b) => a.date.localeCompare(b.date));
    sortedDays.forEach(day => {
      const dateStr = new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR');
      [...day.records].sort((a,b) => a.timestamp - b.timestamp).forEach(record => {
        csvContent += `${dateStr};${new Date(record.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})};${record.plate};${record.driver};${record.invoiceCount}\n`;
      });
    });
    csvContent += `\n;;;Conferido por: ${profile.name}`;
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_geral.csv`;
    link.click();
  };

  const handleExportPDF = () => {
     if (filteredDays.length === 0) return alert("Sem dados para exportar.");
     const doc = new jsPDF();
     const tableBody: any[] = [];
     [...filteredDays].sort((a,b)=>a.date.localeCompare(b.date)).forEach(day => {
        const d = new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR');
        day.records.forEach(r => tableBody.push([d, new Date(r.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}), r.plate, r.driver, r.invoiceCount]));
     });
     autoTable(doc, { head: [['Data', 'Hora', 'Placa', 'Motorista', 'Notas']], body: tableBody });
     doc.save('relatorio.pdf');
  };

  // --- RENDER ---

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkbg text-gray-500">Carregando...</div>;
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen pb-20 no-print bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-carddark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 safe-top">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-2.5 rounded-xl shadow-sm">
              <ClipboardList size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">LogiCheck</h1>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Controle de Conferência</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Install Button (Only Visible if deferredPrompt exists) */}
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick} 
                className="hidden md:flex p-2 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors animate-pulse" 
                title="Instalar App"
              >
                <Smartphone size={20} />
              </button>
            )}

            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Alternar tema">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors" title="Sair do sistema">
              <LogOut size={20} />
            </button>
            
            {/* Discrete Header Avatar - MAIN ACCESS TO PROFILE */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`ml-1 w-8 h-8 rounded-full border-2 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all shadow-sm ${
                activeTab === 'profile' 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary'
              }`}
              title="Meu Perfil"
            >
              {profile.photo ? (
                <img src={profile.photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Install CTA Banner (If available) */}
      {showInstallBtn && (
        <div className="md:hidden bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
           <div className="flex items-center gap-2 text-sm font-medium">
             <Smartphone size={16} />
             <span>Instalar LogiCheck</span>
           </div>
           <button onClick={handleInstallClick} className="px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-bold uppercase">
             Instalar
           </button>
        </div>
      )}

      {/* Tab Navigation - Uniform with the page width */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex p-1.5 bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-4 text-sm md:text-base font-bold flex items-center justify-center gap-3 transition-all rounded-xl ${
              activeTab === 'general' 
                ? 'bg-white dark:bg-carddark text-primary shadow-md transform scale-[1.01]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Truck size={22} />
            CONFERÊNCIA
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-4 text-sm md:text-base font-bold flex items-center justify-center gap-3 transition-all rounded-xl ${
              activeTab === 'manual' 
                ? 'bg-white dark:bg-carddark text-red-600 dark:text-red-400 shadow-md transform scale-[1.01]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <AlertTriangle size={22} />
            MANUAL
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* --- VIEW: GENERAL CONFERENCE --- */}
        {activeTab === 'general' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             
             {/* Stats & Add Button */}
             <div className="flex flex-col md:flex-row gap-6 justify-between">
                <div className="flex gap-4 flex-1">
                    <div className="flex-1 bg-white dark:bg-carddark p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Total Veículos</span>
                      <span className="text-3xl font-bold text-blue-600">{globalStats.vehicles}</span>
                    </div>
                    <div className="flex-1 bg-white dark:bg-carddark p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Total Notas</span>
                      <span className="text-3xl font-bold text-emerald-600">{globalStats.invoices}</span>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {!showAddDate ? (
                    <button onClick={() => setShowAddDate(true)} className="h-full px-8 py-3 bg-gray-900 dark:bg-primary hover:bg-gray-800 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold">
                      <Plus size={24} /> Adicionar Dia
                    </button>
                  ) : (
                    <div className="bg-white dark:bg-carddark p-2 rounded-xl shadow-lg border border-gray-200 flex items-center gap-2">
                      <input type="date" className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white" value={newDateInput || todayStr} onChange={e => setNewDateInput(e.target.value)} />
                      <button onClick={() => handleAddDay(newDateInput || todayStr)} className="bg-primary text-white p-2 rounded-lg">OK</button>
                      <button onClick={() => setShowAddDate(false)} className="p-2 text-gray-500">✕</button>
                    </div>
                  )}
                </div>
             </div>

             {/* Toolbar & Collapsible Filters */}
             <div className="bg-white dark:bg-carddark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                
                {/* Main Toolbar */}
                <div className="p-3 flex flex-wrap gap-2 items-center justify-between">
                   <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        showFilters || filterStart || filterEnd || filterSearch
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                   >
                      <Filter size={18} />
                      Filtros & Busca
                      {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </button>

                   <div className="flex gap-2 flex-wrap flex-1 justify-end">
                     <button onClick={handleExportExcel} disabled={filteredDays.length === 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 transition-colors"><FileSpreadsheet size={16}/> Excel</button>
                     <button onClick={handleExportPDF} disabled={filteredDays.length === 0} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 transition-colors"><FileText size={16}/> PDF</button>
                     <button onClick={handleBackup} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"><Download size={16}/> Backup</button>
                     <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"><Upload size={16}/> Restaurar</button>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                   </div>
                </div>

                {/* Collapsible Filter Area */}
                {showFilters && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                       <div className="md:col-span-5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1 mb-1">
                            <Search size={12} /> Pesquisar Motorista / Placa
                          </label>
                          <input 
                            type="text"
                            value={filterSearch} 
                            onChange={e => setFilterSearch(e.target.value)} 
                            placeholder="Digite o nome ou placa..."
                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                          />
                       </div>
                       <div className="md:col-span-3">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">DATA INICIAL</label>
                          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                       </div>
                       <div className="md:col-span-3">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">DATA FINAL</label>
                          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                       </div>
                       <div className="md:col-span-1">
                          {(filterStart || filterEnd || filterSearch) && (
                            <button onClick={clearFilters} className="w-full p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors text-gray-700 dark:text-gray-200" title="Limpar Filtros">
                              <X size={18} />
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                )}
             </div>

             {/* Chart */}
             <SummaryChart days={filteredDays} isDark={isDark} period={chartPeriod} setPeriod={setChartPeriod} />

             {/* List */}
             <div className="space-y-6">
                {filteredDays.length === 0 ? (
                  <div className="text-center py-10 bg-gray-100 dark:bg-gray-800/50 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-700 text-gray-400">
                    <CalendarRange size={40} className="mx-auto mb-2 opacity-50"/>
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  filteredDays.map(day => (
                    <DaySection key={day.date} dayRecord={day} onAddVehicle={addVehicle} onRemoveVehicle={removeVehicle} onDeleteDay={deleteDay} />
                  ))
                )}
             </div>
          </div>
        )}

        {/* --- VIEW: MANUAL INDEX --- */}
        {activeTab === 'manual' && (
          <ManualIndexSection 
            entries={manualEntries}
            onAddEntry={addManualEntry}
            onRemoveEntry={removeManualEntry}
          />
        )}

        {/* --- VIEW: PROFILE --- */}
        {activeTab === 'profile' && (
          <ProfileSection 
            profile={profile}
            onSave={(newProfile) => setProfile(newProfile)}
          />
        )}
        
        <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={closeConfirmModal} />

      </main>

      <footer className="text-center py-6 border-t border-gray-200 dark:border-gray-800 mt-8 safe-bottom">
        <div className="flex flex-col items-center gap-1">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2026 LogiCheck — Desenvolvido por <span className="font-bold">Leonardo Assunção</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;