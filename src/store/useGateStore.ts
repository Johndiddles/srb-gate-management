import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ActivityLog,
  Guest,
  GuestStatus,
  TransportMode,
  VehicularMovement,
} from "../types";
import { zustandStorage } from "../utils/storage";

interface GateState {
  isLoading: boolean;
  error: string | null;
  isActivated: boolean;
  deviceName: string | null;
  licenseKey: string | null;
  permissions: string[];
  guests: Guest[];
  logs: ActivityLog[];
  vehicularMovements: VehicularMovement[];
  searchQuery: string;

  // Actions
  activateProvider: (
    licenseKey: string,
    deviceName: string,
    permissions: string[],
  ) => void;
  deactivateProvider: () => void;
  setGuests: (guests: Guest[]) => void;
  importGuests: (newGuests: Guest[]) => void;
  fetchGuests: () => Promise<void>;
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
    description: string;
    reason: string;
  }) => Promise<void>;
  logVehicleOut: (input: {
    plateNumber: string;
    description: string;
    reason: string;
  }) => Promise<void>;
  setSearchQuery: (query: string) => void;
  syncPendingLogs: () => Promise<void>;
}

export const useGateStore = create<GateState>()(
  persist(
    (set, get) => ({
      isActivated: false,
      deviceName: null,
      licenseKey: null,
      permissions: [],
      guests: [],
      logs: [],
      vehicularMovements: [],
      searchQuery: "",
      isLoading: false,
      error: null,

      activateProvider: (licenseKey, deviceName, permissions) =>
        set({ isActivated: true, licenseKey, deviceName, permissions }),

      deactivateProvider: () =>
        set({
          isActivated: false,
          licenseKey: null,
          deviceName: null,
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

      fetchGuests: async () => {
        set({ isLoading: true, error: null });
        try {
          const ApiService = (await import("../services/ApiService")).default;
          const guests = await ApiService.fetchGuestsFromApi();
          set({ guests, isLoading: false });
        } catch (e: any) {
          set({
            error: e.message || "Failed to fetch guests",
            isLoading: false,
          });
          throw e;
        }
      },

      updateGuestStatus: (guestId, status) =>
        set((state) => ({
          guests: state.guests.map((g) =>
            g._id === guestId ? { ...g, status } : g,
          ),
        })),

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

          return {
            logs: [newLog, ...state.logs],
            guests: updatedGuests,
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

      initialSyncMovements: async () => {
        try {
          // Note: fetchGuestMovements / fetchVehicleMovements removed since data is pushed individually.
          // Historical data sync can be implemented as individual REST api fetch when needed.
          set((state) => ({}));
        } catch (e) {
          console.error("Failed to load historical movements:", e);
        }
      },

      syncPendingLogs: async () => {
        const { logs, vehicularMovements } = get();
        try {
          const { syncMovementToApi } = await import("../services/ApiService");
          const successfulGuestLogIds: string[] = [];
          const successfulVehicularLogs: string[] = [];

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
                  plateNumber: log.plateNumber,
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
                  guest_name: v.description,
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
