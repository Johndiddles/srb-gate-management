import { Guest } from "../types";

// Mock implementation since no real API endpoint is provided yet.
// In a real app, this would use fetch/axios and environment variables.

export const fetchGuestsFromApi = async (): Promise<Guest[]> => {
  console.log("Fetching guests from API...");

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return mock data that mirrors the structure we expect
  return [
    {
      id: "101-John-Doe-2026-02-16",
      firstName: "John",
      lastName: "Doe",
      roomNumber: "101",
      status: "in-house",
      arrivalDate: "2026-02-16",
      notes: "Fetched from API",
    },
    {
      id: "102-Jane-Smith-2026-02-17",
      firstName: "Jane",
      lastName: "Smith",
      roomNumber: "102",
      status: "arrival",
      arrivalDate: "2026-02-17",
    },
    {
      id: "103-Bob-Builder-2026-02-15",
      firstName: "Bob",
      lastName: "Builder",
      roomNumber: "103",
      status: "checked-out",
      arrivalDate: "2026-02-15",
    },
  ];
};
