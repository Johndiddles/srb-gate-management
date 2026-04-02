import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ActivityLog,
  Guest,
  GuestStatus,
  TransportMode,
  VehicularMovement,
  StaffParkingMovement,
  StaffShift,
} from "../types";
import { zustandStorage } from "../utils/storage";

interface GateState {
  isLoading: boolean;
  error: string | null;
  isActivated: boolean;
  deviceName: string | null;
  deviceToken: string | null;
  licenseKey: string | null;
  permissions: string[];
  guests: Guest[];
  logs: ActivityLog[];
  vehicularMovements: VehicularMovement[];
  staffParkingMovements: StaffParkingMovement[];
  staffShifts: StaffShift[];
  searchQuery: string;

  // Actions
  activateProvider: (
    licenseKey: string,
    deviceName: string,
    permissions: string[],
    deviceToken: string,
  ) => void;
  deactivateProvider: () => void;
  setGuests: (guests: Guest[]) => void;
  importGuests: (newGuests: Guest[]) => void;
  fetchGuests: (
    filters?: import("../services/ApiService").QueryFilters,
  ) => Promise<void>;
  updateGuestStatus: (guestId: string, status: GuestStatus) => void;
  logMovement: (input: {
    guestId: string;
    guestName: string;
    destination: string;
    roomNumber: string;
    mode: TransportMode;
    plateNumber: string;
  }) => Promise<void>;
  completeMovement: (guestId: string) => Promise<void>;
  logVehicleIn: (input: {
    plateNumber: string;
    name: string;
    reason: string;
  }) => Promise<void>;
  logVehicleOut: (input: {
    plateNumber: string;
    name: string;
    reason: string;
  }) => Promise<void>;
  logStaffVehicleIn: (input: {
    staffId: string;
    staffName: string;
    department: string;
    plateNumber?: string;
  }) => Promise<void>;
  logStaffVehicleOut: (input: {
    staffId: string;
    staffName: string;
    department: string;
    plateNumber?: string;
  }) => Promise<void>;
  logStaffShiftIn: (input: {
    staffId: string;
    staffName: string;
    department: string;
  }) => Promise<void>;
  logStaffShiftOut: (app_log_id: string) => Promise<void>;
  logStaffShiftExit: (input: {
    app_log_id: string;
    reason?: string;
  }) => Promise<void>;
  logStaffShiftEntry: (app_log_id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  syncPendingLogs: () => Promise<void>;
  initialSyncMovements: (
    filters?: import("../services/ApiService").QueryFilters,
  ) => Promise<void>;
}

export const useGateStore = create<GateState>()(
  persist(
    (set, get) => ({
      isActivated: false,
      deviceName: null,
      deviceToken: null,
      licenseKey: null,
      permissions: [],
      guests: [],
      logs: [],
      vehicularMovements: [],
      staffParkingMovements: [],
      staffShifts: [],
      searchQuery: "",
      isLoading: false,
      error: null,

      activateProvider: (licenseKey, deviceName, permissions, deviceToken) =>
        set({
          isActivated: true,
          licenseKey,
          deviceName,
          permissions,
          deviceToken,
        }),

      deactivateProvider: () =>
        set({
          isActivated: false,
          licenseKey: null,
          deviceName: null,
          deviceToken: null,
          permissions: [],
        }),

      setGuests: (guests) => set({ guests }),

      importGuests: (newGuests) =>
        set((state) => {
          // Merge logic... existing takes priority or new takes priority?
          // Let's replace wholly for simplicity, or append new.
          // Append new by checking IDs
          const existingIds = new Set(state.guests.map((g) => g._id));
          const toAdd = newGuests.filter((g) => !existingIds.has(g._id));
          return { guests: [...state.guests, ...toAdd] };
        }),

      fetchGuests: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const ApiService = (await import("../services/ApiService")).default;
          const guests = await ApiService.fetchGuestsFromApi(filters);
          set({ guests, isLoading: false });
        } catch (e: any) {
          set({
            error: e.message || "Failed to fetch guests",
            isLoading: false,
          });
          throw e;
        }
      },

      updateGuestStatus: async (guestId, status) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g._id === guestId ? { ...g, status } : g,
          ),
        }));
        try {
          const ApiService = (await import("../services/ApiService")).default;
          await ApiService.updateGuestStatusApi(guestId, status);
        } catch (e) {
          console.error("Failed to sync guest status to API", e);
        }
      },

      logMovement: async (logData) => {
        set((state) => {
          const timestamp = new Date().toISOString();
          const newLog: ActivityLog = {
            id: Date.now().toString(), // Will be used as app_log_id
            guestId: logData.guestId,
            guestName: logData.guestName,
            roomNumber: logData.roomNumber,
            destination: logData.destination,
            mode: logData.mode,
            plateNumber: logData.plateNumber,
            timeOut: timestamp,
            syncStatus: "pending",
          };

          const updatedGuests = state.guests.map((g) =>
            g._id === logData.guestId
              ? { ...g, isOut: true, app_updated_at: timestamp }
              : g,
          );

          let updatedMovements = state.vehicularMovements;

          if (logData.plateNumber) {
            const vehicleIndex = state.vehicularMovements.findIndex(
              (v) =>
                v.plateNumber.toLowerCase() ===
                  logData.plateNumber.toLowerCase() && !v.timeOut,
            );

            if (vehicleIndex !== -1) {
              updatedMovements = [...state.vehicularMovements];
              updatedMovements[vehicleIndex] = {
                ...updatedMovements[vehicleIndex],
                timeOut: timestamp,
                syncStatus: "pending",
              };
            }
          }

          return {
            logs: [newLog, ...state.logs],
            guests: updatedGuests,
            vehicularMovements: updatedMovements,
          };
        });
        get().syncPendingLogs().catch(console.error);
      },

      completeMovement: async (guestId) => {
        set((state) => {
          const timestamp = new Date().toISOString();
          // Find the active log (they left, but haven't returned)
          const logIndex = state.logs.findIndex(
            (l) => l.guestId === guestId && !l.timeIn,
          );

          let updatedLogs = [...state.logs];

          if (logIndex !== -1) {
            updatedLogs[logIndex] = {
              ...updatedLogs[logIndex],
              timeIn: timestamp,
              syncStatus: "pending", // Re-queue it to sync the cycle close
            };
          }

          const updatedGuests = state.guests.map((g) =>
            g._id === guestId
              ? { ...g, isOut: false, app_updated_at: timestamp }
              : g,
          );

          return {
            logs: updatedLogs,
            guests: updatedGuests,
          };
        });
        get().syncPendingLogs().catch(console.error);
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      logVehicleIn: async (movementData) => {
        set((state) => ({
          vehicularMovements: [
            {
              ...movementData,
              id: Date.now().toString(),
              timeIn: new Date().toISOString(),
              syncStatus: "pending",
            },
            ...state.vehicularMovements,
          ],
        }));
        get().syncPendingLogs().catch(console.error);
      },

      logVehicleOut: async (movementData) => {
        set((state) => {
          // Find the active inbound vehicle log based on plateNumber (that doesn't have a timeOut yet)
          const logIndex = state.vehicularMovements.findIndex(
            (v) => v.plateNumber === movementData.plateNumber && !v.timeOut,
          );

          let updatedMovements = [...state.vehicularMovements];

          if (logIndex !== -1) {
            updatedMovements[logIndex] = {
              ...updatedMovements[logIndex],
              timeOut: new Date().toISOString(),
              syncStatus: "pending",
            };
            return { vehicularMovements: updatedMovements };
          }

          // Fallback if no vehicle was found
          return state;
        });
        get().syncPendingLogs().catch(console.error);
      },

      logStaffVehicleIn: async (movementData) => {
        set((state) => ({
          staffParkingMovements: [
            {
              ...movementData,
              id: Date.now().toString(),
              timeIn: new Date().toISOString(),
              syncStatus: "pending",
            },
            ...state.staffParkingMovements,
          ],
        }));
        get().syncPendingLogs().catch(console.error);
      },

      logStaffVehicleOut: async (movementData) => {
        set((state) => {
          const logIndex = state.staffParkingMovements.findIndex(
            (v) =>
              (v.staffId === movementData.staffId ||
                (v.plateNumber &&
                  v.plateNumber === movementData.plateNumber)) &&
              !v.timeOut,
          );

          let updatedMovements = [...state.staffParkingMovements];
          if (logIndex !== -1) {
            updatedMovements[logIndex] = {
              ...updatedMovements[logIndex],
              timeOut: new Date().toISOString(),
              syncStatus: "pending",
            };
            return { staffParkingMovements: updatedMovements };
          }
          return state;
        });
        get().syncPendingLogs().catch(console.error);
      },

      logStaffShiftIn: async (input) => {
        set((state) => ({
          staffShifts: [
            {
              app_log_id: Date.now().toString(),
              staffId: input.staffId,
              staffName: input.staffName,
              department: input.department,
              clockIn: new Date().toISOString(),
              status: "active",
              exits: [],
              syncStatus: "pending",
            },
            ...state.staffShifts,
          ],
        }));
        get().syncPendingLogs().catch(console.error);
      },

      logStaffShiftOut: async (app_log_id) => {
        set((state) => ({
          staffShifts: state.staffShifts.map((s) =>
            s.app_log_id === app_log_id
              ? {
                  ...s,
                  clockOut: new Date().toISOString(),
                  status: "completed",
                  syncStatus: "pending",
                }
              : s,
          ),
        }));
        get().syncPendingLogs().catch(console.error);
      },

      logStaffShiftExit: async (input) => {
        set((state) => ({
          staffShifts: state.staffShifts.map((s) =>
            s.app_log_id === input.app_log_id
              ? {
                  ...s,
                  syncStatus: "pending",
                  exits: [
                    ...s.exits,
                    {
                      app_log_id: Date.now().toString(),
                      timeOut: new Date().toISOString(),
                      reason: input.reason || "",
                    },
                  ],
                }
              : s,
          ),
        }));
        get().syncPendingLogs().catch(console.error);
      },

      logStaffShiftEntry: async (app_log_id) => {
        set((state) => ({
          staffShifts: state.staffShifts.map((s) => {
            if (s.app_log_id === app_log_id) {
              const activeExitIdx = s.exits.findIndex((e) => !e.timeIn);
              if (activeExitIdx !== -1) {
                const newExits = [...s.exits];
                newExits[activeExitIdx] = {
                  ...newExits[activeExitIdx],
                  timeIn: new Date().toISOString(),
                };
                return { ...s, exits: newExits, syncStatus: "pending" };
              }
            }
            return s;
          }),
        }));
        get().syncPendingLogs().catch(console.error);
      },

      initialSyncMovements: async (filters) => {
        try {
          await get().syncPendingLogs();
          const ApiService = (await import("../services/ApiService")).default;
          const remoteMovements =
            await ApiService.fetchDeviceMovements(filters);

          const fetchedShiftsRes =
            await ApiService.fetchStaffShiftsApi(filters);
          const remoteShifts: StaffShift[] = (fetchedShiftsRes.data || []).map(
            (s: any) => ({
              ...s,
              syncStatus: "synced",
            }),
          );

          const remoteLogs: ActivityLog[] = [];
          const remoteVehicles: VehicularMovement[] = [];
          const remoteStaffParking: StaffParkingMovement[] = [];

          for (const m of remoteMovements as any[]) {
            if (m.type === "GUEST") {
              remoteLogs.push({
                id: m.app_log_id,
                guestId: m.guest_id || "",
                guestName: m.guest_name || "",
                roomNumber: m.room_number || "",
                destination: m.reason || "",
                timeOut: m.timeOut
                  ? new Date(m.timeOut).toISOString()
                  : new Date(m.timestamp || Date.now()).toISOString(),
                timeIn: m.timeIn ? new Date(m.timeIn).toISOString() : undefined,
                mode: (m.mode as TransportMode) || "walk",
                plateNumber: m.plate_number,
                syncStatus: "synced",
              });
            } else if (m.type === "VEHICULAR") {
              remoteVehicles.push({
                id: m.app_log_id,
                plateNumber: m.plate_number || "",
                name: m.name || "",
                reason: m.reason || "",
                timeIn: m.timeIn
                  ? new Date(m.timeIn).toISOString()
                  : new Date(m.timestamp || Date.now()).toISOString(),
                timeOut: m.timeOut
                  ? new Date(m.timeOut).toISOString()
                  : undefined,
                syncStatus: "synced",
              });
            } else if (m.type === "STAFF_PARKING") {
              remoteStaffParking.push({
                id: m.app_log_id,
                staffId: m.staff_id || m.guest_id || "",
                staffName: m.name || m.guest_name || "",
                department: m.department || m.reason || "",
                plateNumber: m.plate_number || "",
                timeIn: m.timeIn
                  ? new Date(m.timeIn).toISOString()
                  : new Date(m.timestamp || Date.now()).toISOString(),
                timeOut: m.timeOut
                  ? new Date(m.timeOut).toISOString()
                  : undefined,
                syncStatus: "synced",
              });
            }
          }

          set((state) => {
            const pendingLogs = state.logs.filter(
              (l) => l.syncStatus === "pending",
            );
            const pendingVehicles = state.vehicularMovements.filter(
              (v) => v.syncStatus === "pending",
            );
            const pendingStaffParking = state.staffParkingMovements.filter(
              (s) => s.syncStatus === "pending",
            );

            const pendingLogIds = new Set(pendingLogs.map((l) => l.id));
            const pendingVehicleIds = new Set(pendingVehicles.map((v) => v.id));
            const pendingStaffParkingIds = new Set(
              pendingStaffParking.map((s) => s.id),
            );

            const finalLogs = [
              ...pendingLogs,
              ...remoteLogs.filter((l) => !pendingLogIds.has(l.id)),
            ];

            const finalVehicles = [
              ...pendingVehicles,
              ...remoteVehicles.filter((v) => !pendingVehicleIds.has(v.id)),
            ];

            const finalStaffParking = [
              ...pendingStaffParking,
              ...remoteStaffParking.filter(
                (s) => !pendingStaffParkingIds.has(s.id),
              ),
            ];

            const pendingShifts = state.staffShifts.filter(
              (s) => s.syncStatus === "pending",
            );
            const pendingShiftIds = new Set(
              pendingShifts.map((s) => s.app_log_id),
            );
            const finalShifts = [
              ...pendingShifts,
              ...remoteShifts.filter(
                (rs) => !pendingShiftIds.has(rs.app_log_id),
              ),
            ];

            return {
              logs: finalLogs,
              vehicularMovements: finalVehicles,
              staffParkingMovements: finalStaffParking,
              staffShifts: finalShifts,
            };
          });
        } catch (e) {
          console.error("Failed to load historical movements:", e);
        }
      },

      syncPendingLogs: async () => {
        const { logs, vehicularMovements, staffShifts } = get();
        try {
          const { syncMovementToApi, syncStaffShiftsApi } =
            await import("../services/ApiService");
          const successfulGuestLogIds: string[] = [];
          const successfulVehicularLogs: string[] = [];
          const successfulStaffParkingLogs: string[] = [];

          // Sync pending guest logs
          for (const log of logs) {
            if (log.syncStatus === "pending") {
              try {
                await syncMovementToApi({
                  type: "GUEST",
                  guest_name: log.guestName,
                  reason: log.destination,
                  guest_id: log.guestId,
                  app_log_id: log.id,
                  timeOut: log.timeOut,
                  timeIn: log.timeIn,
                  mode: log.mode,
                  room_number: log.roomNumber,
                  plate_number: log.plateNumber,
                });
                successfulGuestLogIds.push(log.id);

                // Mark as synced locally
                set((state) => ({
                  logs: state.logs.map((l) =>
                    l.id === log.id ? { ...l, syncStatus: "synced" } : l,
                  ),
                }));
              } catch (e) {
                console.error("Failed to sync guest log:", log.id, e);
              }
            }
          }

          // Sync pending vehicle movements
          for (const v of vehicularMovements) {
            if (v.syncStatus === "pending") {
              try {
                await syncMovementToApi({
                  type: "VEHICULAR",
                  name: v.name,
                  plate_number: v.plateNumber,
                  reason: v.reason,
                  app_log_id: v.id,
                  timeIn: v.timeIn,
                  timeOut: v.timeOut,
                });
                successfulVehicularLogs.push(v.id);

                set((state) => ({
                  vehicularMovements: state.vehicularMovements.map((veh) =>
                    veh.id === v.id ? { ...veh, syncStatus: "synced" } : veh,
                  ),
                }));
              } catch (e) {
                console.error("Failed to sync vehicle movement:", v.id, e);
              }
            }
          }

          const pendingShiftsList = staffShifts.filter(
            (s) => s.syncStatus === "pending",
          );
          if (pendingShiftsList.length > 0) {
            try {
              await syncStaffShiftsApi(
                pendingShiftsList.map(({ syncStatus, ...rest }) => rest),
              );
              set((state) => ({
                staffShifts: state.staffShifts.map((s) =>
                  s.syncStatus === "pending"
                    ? { ...s, syncStatus: "synced" }
                    : s,
                ),
              }));
            } catch (e) {
              console.error("Failed to sync staff shifts", e);
            }
          }

          // Sync pending staff parking movements
          for (const sp of get().staffParkingMovements) {
            if (sp.syncStatus === "pending") {
              try {
                await syncMovementToApi({
                  type: "STAFF_PARKING",
                  name: sp.staffName,
                  guest_id: sp.staffId,
                  staff_id: sp.staffId,
                  department: sp.department,
                  plate_number: sp.plateNumber,
                  app_log_id: sp.id,
                  timeIn: sp.timeIn,
                  timeOut: sp.timeOut,
                });
                successfulStaffParkingLogs.push(sp.id);

                set((state) => ({
                  staffParkingMovements: state.staffParkingMovements.map((s) =>
                    s.id === sp.id ? { ...s, syncStatus: "synced" } : s,
                  ),
                }));
              } catch (e) {
                console.error(
                  "Failed to sync staff parking movement:",
                  sp.id,
                  e,
                );
              }
            }
          }
        } catch (e) {
          console.error("Failed to load sync service:", e);
        }
      },
    }),
    {
      name: "gate-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
