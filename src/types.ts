export interface AIAssessment {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  detectedSounds: string[];
  recommendedAction: string;
}

export interface Incident {
  id: string;
  citizenName: string;
  citizenPhone: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'DISPATCHED' | 'RESOLVED';
  audioVideoBase64?: string; // Data URL of the recorded 10s video/audio
  emergencyContactsNotified: string[];
  dishaStaffComment?: string;
  dispatchUnit?: string;
  aiAssessment?: AIAssessment;
  smsLogs: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface PatrolUnit {
  id: string;
  name: string;
  phone: string;
  status: 'IDLE' | 'DISPATCHED' | 'ON_SITE';
  currentLocationName: string;
  lat: number;
  lng: number;
}
