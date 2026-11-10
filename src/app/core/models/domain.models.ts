export type EmployeeRole = 'ADMIN' | 'MANAGER' | 'SORTER' | 'COURIER';

export type AccountStatus = 'ACTIVE' | 'BLOCKED';

export type ParcelDimensions = 'A' | 'B' | 'C' | 'GABARYT_NIESTANDARDOWY';

export type ParcelStatus =
  | 'Zarejestrowana'
  | 'Do wyjaśnienia (błąd danych odbiorcy)'
  | 'Przyjęto w sortowni'
  | 'Posortowano'
  | 'Strefa przesyłek problematycznych'
  | 'Oczekuje na stanowisku wydawczym'
  | 'Pobrano ze stanowiska'
  | 'W doręczeniu'
  | 'Gotowa do odbioru'
  | 'Doręczona'
  | 'Nieudana próba doręczenia (do zdania)'
  | 'Zwrócona na stanowisko/sortownię';

export interface ParcelHistoryEntry {
  timestamp: string;
  status: ParcelStatus | string;
  location: string;
  description: string;
  notificationSent?: boolean;
}

export interface Parcel {
  trackingNumber: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  deliveryAddress: string;
  postalCode: string;
  city: string;
  deliveryNotes?: string;
  weightKg: number;
  dimensions: ParcelDimensions;
  status: ParcelStatus;
  currentLocation: string;
  assignedRegionId?: string;
  assignedStationId?: string;
  assignedCourierId?: string;
  pickupCode?: string;
  redirectedPointId?: string;
  redirectedPointName?: string;
  nonDeliveryReason?: string;
  damagedLabel?: boolean;
  recipientSignature?: string;
  routeStopOrder?: number;
  estimatedStopTime?: string;
  history: ParcelHistoryEntry[];
}

export interface Employee {
  id: string;
  fullName: string;
  login: string;
  password?: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: AccountStatus;
  permissions: string[];
  assignedRegionId?: string;
}

export interface DispatchStation {
  id: string;
  name: string;
  operationalParams: string;
  maxCapacity: number;
  assignedRegionId?: string;
}

export interface DeliveryRegion {
  id: string;
  name: string;
  postalCodePrefixes: string[];
  boundariesDescription: string;
  assignedStationId?: string;
}

export interface PickupPoint {
  id: string;
  name: string;
  type: 'PUNKT_ODBIORU' | 'AUTOMAT_PACZKOWY';
  address: string;
  city: string;
  maxDimensions: ParcelDimensions[];
}

export interface BackupResult {
  success: boolean;
  timestamp: string;
  fileName?: string;
  sizeMb?: number;
  integrityVerified: boolean;
  errorMessage?: string;
}

export interface OperationalReportRequest {
  dateFrom: string;
  dateTo: string;
  includeWorkloadSummary: boolean;     // Przebieg alternatywny 1: obciążenie stanowisk i kurierów
  includeFailedDeliveryReasons: boolean; // Przebieg alternatywny 2: przyczyny nieudanych doręczeń
  includeDeliveryEffectiveness: boolean; // Przebieg alternatywny 3: skuteczność doręczeń i zwrotów
}

export interface OperationalReportResult {
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  totalProcessedParcels: number;
  summaryNote: string;
  workloadSummary?: {
    stationLoads: { stationId: string; stationName: string; parcelCount: number; utilizationPercent: number }[];
    courierLoads: { courierName: string; region: string; assignedCount: number; completedCount: number }[];
  };
  failedDeliveryReasons?: {
    reason: string;
    count: number;
    sharePercent: number;
  }[];
  effectivenessStats?: {
    deliveredCount: number;
    returnedCount: number;
    pendingCount: number;
    effectivenessRatePercent: number;
  };
}

export interface SortingWorkSummaryRequest {
  timeRange: string;
  indicators: string[];
}

export interface SortingWorkSummaryResult {
  generatedAt: string;
  timeRange: string;
  throughputPerHour: number;
  sortingEfficiencyPercent: number;
  averageProcessingMinutes: number;
  problematicParcelsCount: number;
  selectedIndicatorsSummary: { label: string; value: string }[];
}
