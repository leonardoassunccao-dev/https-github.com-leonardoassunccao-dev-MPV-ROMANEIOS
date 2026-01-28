import React, { useState, useMemo } from 'react';
import { Trash2, PlusCircle, Printer, Truck, FileText, Clock } from 'lucide-react';
import { DayRecord, VehicleRecord } from '../types';

interface DaySectionProps {
  dayRecord: DayRecord;
  onAddVehicle: (date: string, vehicle: Omit<VehicleRecord, 'id' | 'timestamp'>) => void;
  onRemoveVehicle: (date: string, vehicleId: string) => void;
  onDeleteDay: (date: string) => void;
}

const DaySection: React.FC<DaySectionProps> = ({ dayRecord, onAddVehicle, onRemoveVehicle, onDeleteDay }) => {
  const [plate, setPlate] = useState('');
  const [driver, setDriver] = useState('');
  const [invoices, setInvoices] = useState('');
  const [error, setError] = useState('');

  // Derived state for summary
  const totalVehicles = dayRecord.records.length;
  const totalInvoices = useMemo(() => 
    dayRecord.records.reduce((acc, curr) => acc + curr.invoiceCount, 0), 
  [dayRecord.records]);

  // Sort records by timestamp descending (Newest first) for UI display
  const sortedRecords = useMemo(() => {
    return [...dayRecord.records].sort((a, b) => b.timestamp - a.timestamp);
  }, [dayRecord.records]);

  // Date formatting
  const dateObj = new Date(dayRecord.date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const fullDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Plate Mask Handler
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();

    // 1. Remove everything that is NOT a letter or number
    value = value.replace(/[^A-Z0-9]/g, '');

    // 2. Limit to 7 alphanumeric characters
    if (value.length > 7) {
      value = value.slice(0, 7);
    }

    // 3. Add hyphen automatically after the 3rd character
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }

    setPlate(value);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!plate.trim() || !driver.trim() || !invoices.trim()) {
      setError('Preencha todos os campos.');
      return;
    }

    // Plate Validation (Must be exactly 8 chars: ABC-1234)
    if (plate.length < 8) {
      setError('A placa deve estar completa (ex: ABC-1234).');
      return;
    }

    const invoiceNum = parseInt(invoices, 10);
    if (isNaN(invoiceNum) || invoiceNum < 0) {
      setError('Quantidade de notas inválida.');
      return;
    }

    onAddVehicle(dayRecord.date, {
      plate: plate.toUpperCase(),
      driver: driver,
      invoiceCount: invoiceNum
    });

    // Reset form
    setPlate('');
    setDriver('');
    setInvoices('');
  };

  const handlePrint = () => {
    // For print, usually chronological (oldest first) is better for reading a log
    const printRecords = [...dayRecord.records].sort((a, b) => a.timestamp - b.timestamp);

    const printContents = `
      <div style="padding: 20px; font-family: sans-serif; position: relative; min-height: 95vh;">
        <h1 style="font-size: 24px; margin-bottom: 5px;">Relatório de Conferência</h1>
        <h2 style="font-size: 18px; color: #555; margin-bottom: 20px;">${dayName} - ${fullDate}</h2>
        
        <div style="margin-bottom: 20px; border: 1px solid #000; padding: 15px; border-radius: 4px;">
           <strong>Resumo do Dia:</strong><br/>
           Veículos: ${totalVehicles}<br/>
           Notas Fiscais: ${totalInvoices}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="border: 1px solid #000; padding: 8px; text-align: left;">Hora</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left;">Placa</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left;">Motorista</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Qtd. Notas</th>
            </tr>
          </thead>
          <tbody>
            ${printRecords.map(r => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">${new Date(r.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                <td style="border: 1px solid #000; padding: 8px;">${r.plate}</td>
                <td style="border: 1px solid #000; padding: 8px;">${r.driver}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${r.invoiceCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #000; text-align: right; color: #000; font-size: 12px;">
          Conferido por: <strong>Leonardo Assunção</strong>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Imprimir Romaneio</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      // Small delay to ensure styles are ready (even though we use inline styles)
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      alert("Por favor, permita popups para este site para imprimir o relatório.");
    }
  };

  return (
    <div className="mb-8 bg-white dark:bg-carddark rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-2xl font-bold capitalize text-primary dark:text-blue-400">
            {dayName}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{fullDate}</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="text-right mr-4 hidden md:block">
              <p className="text-sm text-gray-500 dark:text-gray-400">Resumo Diário</p>
              <div className="flex gap-3 text-sm font-bold">
                 <span className="text-blue-600 dark:text-blue-400">{totalVehicles} Veículos</span>
                 <span className="text-emerald-600 dark:text-emerald-400">{totalInvoices} Notas</span>
              </div>
           </div>
           <button 
             onClick={handlePrint}
             className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
             title="Imprimir dia"
           >
             <Printer size={20} />
           </button>
           <button 
             onClick={() => onDeleteDay(dayRecord.date)}
             className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
             title="Excluir dia inteiro"
           >
             <Trash2 size={20} />
           </button>
        </div>
      </div>

      <div className="p-6">
        {/* Input Form */}
        <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-end mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Placa</label>
            <input 
              type="text" 
              value={plate}
              onChange={handlePlateChange}
              placeholder="ABC-1234"
              maxLength={8}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none uppercase font-mono"
            />
          </div>
          <div className="flex-[2] w-full">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Motorista</label>
            <input 
              type="text" 
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="Nome do motorista"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Qtd. Notas</label>
            <input 
              type="number" 
              value={invoices}
              onChange={(e) => setInvoices(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <button 
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-primary hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 h-[42px]"
          >
            <PlusCircle size={18} />
            <span>Salvar</span>
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mb-4 -mt-4">{error}</p>}

        {/* List */}
        {dayRecord.records.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 italic border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-lg">
            Nenhum veículo registrado neste dia.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
             {/* Desktop Headers (Hidden on Mobile) */}
             <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-2">Hora</div>
                <div className="col-span-3">Placa</div>
                <div className="col-span-4">Motorista</div>
                <div className="col-span-2 text-center">Notas</div>
                <div className="col-span-1"></div>
             </div>

             {/* Items - Always Sorted (Newest First) */}
             {sortedRecords.map((record) => (
               <div key={record.id} className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow items-center relative">
                  
                  {/* Mobile Label / Content Structure */}
                  <div className="flex items-center gap-2 col-span-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Clock size={14} className="md:hidden" />
                    <span className="font-mono">
                      {new Date(record.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 col-span-3 font-bold text-gray-800 dark:text-gray-200">
                    <Truck size={14} className="md:hidden text-gray-400" />
                    <span className="uppercase tracking-wide font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-sm">
                      {record.plate}
                    </span>
                  </div>

                  <div className="col-span-4 text-gray-700 dark:text-gray-300 truncate w-full">
                    {record.driver}
                  </div>

                  <div className="flex items-center gap-2 col-span-2 md:justify-center">
                    <FileText size={14} className="md:hidden text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {record.invoiceCount}
                    </span>
                    <span className="md:hidden text-gray-500 text-xs">notas</span>
                  </div>

                  <div className="col-span-1 flex justify-end absolute top-2 right-2 md:relative md:top-auto md:right-auto">
                    <button 
                      onClick={() => onRemoveVehicle(dayRecord.date, record.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                      title="Remover registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DaySection;