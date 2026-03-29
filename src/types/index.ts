export type GuestStatus = "arrival" | "in-house" | "checked-out";

export interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  status: GuestStatus;
  arrivalDate: string; // ISO Date string
  notes?: string;
  isOut?: boolean;
  app_updated_at?: string;
}

export type TransportMode = "walk" | "taxi" | "personal" | "bus";

export interface ActivityLog {
  id: string; // Add index signature if needed for FlatList
  guestId: string;
  guestName: string; // Denormalized for easier export/audit
  roomNumber: string;
  destination: string;
  timeOut: string; // The cycle starts when they leave
  timeIn?: string; // The cycle ends when they return
  mode?: TransportMode;
  plateNumber?: string;
  syncStatus: "pending" | "synced" | "failed";
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
  plateNumber: string;
  reason: string;
  name: string;
  timeIn: string; // The cycle starts when treating a vehicle entry
  timeOut?: string; // The cycle ends when they leave
  syncStatus: "pending" | "synced" | "failed";
}

export interface StaffParkingMovement {
  id: string; // app_log_id
  staffId: string;
  staffName: string;
  department: string;
  plateNumber?: string;
  timeIn: string;
  timeOut?: string;
  syncStatus: "pending" | "synced" | "failed";
}

export interface ShiftActivity {
  app_log_id: string;
  timeOut: string;
  timeIn?: string;
  reason?: string;
}

export interface StaffShift {
  app_log_id: string;
  staffId: string;
  staffName: string;
  department: string;
  clockIn: string;
  clockOut?: string;
  status: "active" | "completed";
  deviceName?: string;
  exits: ShiftActivity[];
  syncStatus: "pending" | "synced" | "failed";
}
