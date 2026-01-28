import React, { useState, useMemo } from 'react';
import { ManualEntry, ManualReason, DriverType } from '../types';
import { AlertTriangle, Clock, TrendingUp, Truck, PlusCircle, Trash2, FileText, Printer } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ManualIndexSectionProps {
  entries: ManualEntry[];
  onAddEntry: (entry: Omit<ManualEntry, 'id' | 'timestamp'>) => void;
  onRemoveEntry: (id: string) => void;
}

const REASONS: ManualReason[] = ['App inoperante', 'Falha de sinal', 'Não realizado', 'Outros'];
const DRIVER_TYPES: DriverType[] = ['Motorista Telog', 'Motorista Terceiro', 'Provinda'];

const ManualIndexSection: React.FC<ManualIndexSectionProps> = ({ entries, onAddEntry, onRemoveEntry }) => {
  // Form State
  const [driver, setDriver] = useState('');
  const [plate, setPlate] = useState('');
  const [driverType, setDriverType] = useState<DriverType>('Motorista Telog');
  const [totalNfs, setTotalNfs] = useState('');
  const [unscannedNfs, setUnscannedNfs] = useState('');
  const [reason, setReason] = useState<ManualReason>('App inoperante');
  const [error, setError] = useState('');

  // Plate Mask (Same as DaySection)
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
    setPlate(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!driver || !plate || !totalNfs || !unscannedNfs) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (plate.length < 8) {
      setError('Placa inválida (ex: ABC-1234).');
      return;
    }

    const nfsTotal = parseInt(totalNfs);
    const nfsUnscanned = parseInt(unscannedNfs);

    if (nfsUnscanned > nfsTotal) {
      setError('NFs não bipadas não podem ser maior que o total.');
      return;
    }

    // Auto calculate rework time (2 mins per unscanned NF)
    const reworkTime = nfsUnscanned * 2;

    onAddEntry({
      date: new Date().toISOString().split('T')[0],
      driver,
      plate,
      driverType,
      totalNfs: nfsTotal,
      unscannedNfs: nfsUnscanned,
      reason,
      reworkTimeMinutes: reworkTime
    });

    // Reset
    setDriver('');
    setPlate('');
    setDriverType('Motorista Telog');
    setTotalNfs('');
    setUnscannedNfs('');
    setReason('App inoperante');
  };

  // --- KPIs Calculation ---
  const kpis = useMemo(() => {
    const totalReworkMinutes = entries.reduce((acc, curr) => acc + curr.reworkTimeMinutes, 0);
    const totalOccurrences = entries.length;
    
    // Ranking Logic
    const driverRanking: Record<string, number> = {};
    entries.forEach(e => {
      driverRanking[e.driver] = (driverRanking[e.driver] || 0) + 1;
    });

    // Sort entries by date desc
    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

    const topDrivers = Object.entries(driverRanking)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Top 3

    return { totalReworkMinutes, totalOccurrences, topDrivers, sortedEntries };
  }, [entries]);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
  };

  // --- PDF Export ---
  const handleExportPDF = () => {
    if (kpis.sortedEntries.length === 0) return alert("Não há dados para exportar.");

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Relatório de Índice de Conferência Manual", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);

    // Summary Box
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 35, 182, 20, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text("RESUMO GERAL", 18, 42);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Total de Ocorrências: ${kpis.totalOccurrences}`, 18, 50);
    doc.text(`Tempo Total de Retrabalho: ${formatTime(kpis.totalReworkMinutes)}`, 100, 50);
    doc.setFont("helvetica", "normal");

    // Table Data
    const tableBody = kpis.sortedEntries.map(entry => [
        new Date(entry.date).toLocaleDateString('pt-BR'),
        entry.driver,
        (entry as any).carrier ? (entry as any).carrier : (entry.driverType || '-'),
        entry.plate,
        `${entry.unscannedNfs} / ${entry.totalNfs}`,
        entry.reason,
        formatTime(entry.reworkTimeMinutes)
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Motorista', 'Vínculo', 'Placa', 'NFs (Man/Tot)', 'Motivo', 'Tempo']],
      body: tableBody,
      headStyles: { fillColor: [220, 38, 38], textColor: 255 }, // Red headers
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        4: { halign: 'center' },
        6: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }
      }
    });

    doc.save(`relatorio_manual_index_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Print Functionality ---
  const handlePrint = () => {
    if (kpis.sortedEntries.length === 0) return alert("Não há dados para imprimir.");

    const printContents = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 5px; color: #333;">Relatório de Índice de Conferência Manual</h1>
        <p style="font-size: 12px; color: #666; margin-bottom: 20px;">
          Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>

        <div style="margin-bottom: 30px; border: 1px solid #ddd; background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
           <strong style="color: #444; display: block; margin-bottom: 10px; font-size: 14px;">RESUMO GERAL</strong>
           <div style="display: flex; gap: 40px;">
             <div>Total de Ocorrências: <strong>${kpis.totalOccurrences}</strong></div>
             <div>Tempo Total de Retrabalho: <strong>${formatTime(kpis.totalReworkMinutes)}</strong></div>
           </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px;">
          <thead>
            <tr style="background: #e5e7eb;">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Data</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Motorista</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Vínculo</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Placa</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">NFs (Man/Tot)</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Motivo</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Tempo</th>
            </tr>
          </thead>
          <tbody>
            ${kpis.sortedEntries.map(entry => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 8px;">${new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${entry.driver}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${(entry as any).carrier ? (entry as any).carrier : (entry.driverType || '-')}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${entry.plate}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${entry.unscannedNfs} / ${entry.totalNfs}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${entry.reason}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatTime(entry.reworkTimeMinutes)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; padding-top: 10px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 11px;">
           © 2026 LogiCheck — Desenvolvido por <strong>Leonardo Assunção</strong>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Imprimir Índice Manual</title></head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      alert("Por favor, permita popups para imprimir.");
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Rework Time */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-800 rounded-lg text-red-600 dark:text-red-100">
            <Clock size={24} />
          </div>
          <div>
             <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tempo de Retrabalho</p>
             <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatTime(kpis.totalReworkMinutes)}</p>
             <p className="text-xs text-red-600 dark:text-red-300">Estimado (2 min/NF)</p>
          </div>
        </div>

        {/* Card 2: Total Occurrences */}
        <div className="bg-white dark:bg-carddark border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-200">
            <AlertTriangle size={24} />
          </div>
          <div>
             <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ocorrências Manuais</p>
             <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.totalOccurrences}</p>
          </div>
        </div>

        {/* Card 3: Ranking */}
        <div className="bg-white dark:bg-carddark border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
           <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase">Ranking (Mais Ocorrências)</span>
           </div>
           <ul className="text-sm">
             {kpis.topDrivers.length === 0 ? (
               <li className="text-gray-400 italic">Sem dados</li>
             ) : (
               kpis.topDrivers.map(([driver, count], index) => (
                 <li key={driver} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                   <span className="font-medium text-gray-700 dark:text-gray-200">{index + 1}. {driver}</span>
                   <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-bold">{count}x</span>
                 </li>
               ))
             )}
           </ul>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-carddark p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <PlusCircle size={20} className="text-primary" />
          Registrar Conferência Manual
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1 */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Motorista</label>
              <input 
                value={driver} onChange={e => setDriver(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Nome"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Placa</label>
              <input 
                value={plate} onChange={handlePlateChange}
                maxLength={8}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white font-mono uppercase"
                placeholder="ABC-1234"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Vínculo do Motorista</label>
               <select 
                 value={driverType} 
                 onChange={e => setDriverType(e.target.value as DriverType)}
                 className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
               >
                 {DRIVER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
               </select>
            </div>
            
            {/* Row 2 */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Qtd. NFs Total</label>
              <input 
                type="number" min="0" value={totalNfs} onChange={e => setTotalNfs(e.target.value)}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 text-red-600 dark:text-red-400">NFs Não Bipadas</label>
              <input 
                type="number" min="0" value={unscannedNfs} onChange={e => setUnscannedNfs(e.target.value)}
                className="w-full p-2 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 dark:text-white"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Motivo</label>
               <select 
                 value={reason} 
                 onChange={e => setReason(e.target.value as ManualReason)}
                 className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
               >
                 {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-colors">
              Adicionar Ocorrência
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-carddark rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
           <h3 className="font-bold text-gray-700 dark:text-gray-200">Histórico de Ocorrências</h3>
           <div className="flex gap-2">
             <button 
               onClick={handlePrint}
               className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium transition-all"
               title="Imprimir"
             >
               <Printer size={16} className="text-blue-600" />
               Imprimir
             </button>
             <button 
               onClick={handleExportPDF}
               className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium transition-all"
               title="Baixar Relatório em PDF"
             >
               <FileText size={16} className="text-red-500" />
               Exportar PDF
             </button>
           </div>
        </div>
        
        {kpis.sortedEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
             Nenhuma ocorrência manual registrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Motorista / Vínculo</th>
                  <th className="px-4 py-3">Placa</th>
                  <th className="px-4 py-3 text-center">NFs Manuais</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3 text-right">Retrabalho</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {kpis.sortedEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800 dark:text-gray-200">{entry.driver}</div>
                      <div className="text-xs text-gray-500">
                        {/* Fallback for old data if carrier existed, though type is updated */}
                        {(entry as any).carrier ? (entry as any).carrier : entry.driverType}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">{entry.plate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {entry.unscannedNfs} / {entry.totalNfs}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.reason}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
                      {formatTime(entry.reworkTimeMinutes)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => onRemoveEntry(entry.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManualIndexSection;