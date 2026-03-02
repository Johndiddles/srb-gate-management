export type GuestStatus = "arrival" | "in-house" | "checked-out";

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  status: GuestStatus;
  arrivalDate: string; // ISO Date string
  notes?: string;
}

export interface ActivityLog {
  id: string;
  guestId: string;
  guestName: string; // Denormalized for easier export/audit
  roomNumber: string;
  timeOut: string; // ISO
  timeIn?: string; // ISO
  destination: string;
  mode: "walk" | "taxi" | "personal" | "shuttle";
  plateNumber?: string;
}

// For the daily snapshot file
export interface DailySnapshot {
  date: string;
  guests: Guest[];
  logs: ActivityLog[];
  vehicularMovements?: VehicularMovement[];
}

export interface VehicularMovement {
  id: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  name: string;
  plateNumber: string;
  reason: string;
}
