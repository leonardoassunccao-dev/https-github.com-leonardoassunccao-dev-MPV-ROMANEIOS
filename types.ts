export interface VehicleRecord {
  id: string;
  plate: string;
  driver: string;
  invoiceCount: number;
  timestamp: number;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  records: VehicleRecord[];
}

export interface GlobalStats {
  totalVehicles: number;
  totalInvoices: number;
}

export type ManualReason = 'App inoperante' | 'Falha de sinal' | 'Não realizado' | 'Outros';
export type DriverType = 'Motorista Telog' | 'Motorista Terceiro' | 'Provinda';

export interface ManualEntry {
  id: string;
  date: string;
  timestamp: number;
  driver: string;
  plate: string;
  driverType: DriverType;
  totalNfs: number;
  unscannedNfs: number;
  reason: ManualReason;
  reworkTimeMinutes: number; // Calculated automatically
}

export interface UserProfile {
  name: string;
  photo: string | null;
  email: string;
  password?: string;
}