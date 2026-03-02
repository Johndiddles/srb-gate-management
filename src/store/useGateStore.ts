import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ActivityLog, Guest, GuestStatus, VehicularMovement } from "../types";
import { zustandStorage } from "../utils/storage";

interface GateState {
  guests: Guest[];
  logs: ActivityLog[];
  vehicularMovements: VehicularMovement[];
  searchQuery: string;

  // Actions
  setGuests: (guests: Guest[]) => void;
  importGuests: (newGuests: Guest[]) => void;
  fetchGuests: () => Promise<void>;
  updateGuestStatus: (guestId: string, status: GuestStatus) => void;
  logMovement: (log: Omit<ActivityLog, "id" | "timeOut">) => void;
  completeMovement: (logId: string) => void; // Sets timeIn
  logVehicleIn: (
    movement: Omit<VehicularMovement, "id" | "timeIn" | "timeOut">,
  ) => void;
  logVehicleOut: (movementId: string) => void;
  setSearchQuery: (query: string) => void;
  resetDailyLogs: () => void; // Archive logic call this
}

export const useGateStore = create<GateState>()(
  persist(
    (set, get) => ({
      guests: [],
      logs: [],
      vehicularMovements: [],
      searchQuery: "",

      setGuests: (guests) => set({ guests }),

      importGuests: (newGuests) =>
        set(() => {
          // Replace entire guest list with imported data
          return {
            guests: newGuests,
          };
        }),

      fetchGuests: async () => {
        try {
          const { fetchGuestsFromApi } = await import("../services/ApiService");
          const guests = await fetchGuestsFromApi();
          set({ guests });
        } catch (e) {
          console.error("Failed to fetch from API", e);
        }
      },

      updateGuestStatus: (guestId, status) =>
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === guestId ? { ...g, status } : g,
          ),
        })),

      logMovement: (logData) =>
        set((state) => {
          const timeOut = new Date().toISOString();
          let updatedVehicularMovements = state.vehicularMovements;

          // Auto-logout logic for taxis
          if (logData.mode === "taxi" && logData.plateNumber) {
            updatedVehicularMovements = state.vehicularMovements.map((v) => {
              if (
                v.plateNumber === logData.plateNumber &&
                v.timeIn &&
                !v.timeOut
              ) {
                return { ...v, timeOut };
              }
              return v;
            });
          }

          return {
            logs: [
              {
                ...logData,
                id: Date.now().toString(), // Simple ID
                timeOut,
              },
              ...state.logs,
            ],
            vehicularMovements: updatedVehicularMovements,
          };
        }),

      completeMovement: (logId) =>
        set((state) => ({
          logs: state.logs.map((l) =>
            l.id === logId ? { ...l, timeIn: new Date().toISOString() } : l,
          ),
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      logVehicleIn: (movementData) =>
        set((state) => ({
          vehicularMovements: [
            {
              ...movementData,
              id: Date.now().toString(),
              timeIn: new Date().toISOString(),
            },
            ...state.vehicularMovements,
          ],
        })),

      logVehicleOut: (movementId) =>
        set((state) => ({
          vehicularMovements: state.vehicularMovements.map((v) =>
            v.id === movementId
              ? { ...v, timeOut: new Date().toISOString() }
              : v,
          ),
        })),

      resetDailyLogs: () => set({ logs: [], vehicularMovements: [] }), // Archives should happen before this
    }),
    {
      name: "gate-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
