import { Guest } from "../types";

// export const API_BASE_URL = "http://localhost:3000/api";
export const API_BASE_URL = "http://192.168.0.102:3000/api";

export const activateDevice = async (
  licenseKey: string,
  deviceName: string,
) => {
  const res = await fetch(`${API_BASE_URL}/licenses/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      license_key: licenseKey,
      device_name: deviceName,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Activation failed");
  }

  return res.json(); // { message, permissions }
};

export const fetchGuestsFromApi = async (): Promise<Guest[]> => {
  const res = await fetch(`${API_BASE_URL}/guests`);
  if (!res.ok) {
    throw new Error("Failed to fetch guest list");
  }

  const data = await res.json();
  return data || [];
};

export const syncMovementToApi = async (body: any) => {
  console.log("Syncing movement to API...", { body });
  const res = await fetch(`${API_BASE_URL}/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json();
    console.log({ data });
    throw new Error("Failed to sync movement to server");
  } else {
    const data = await res.json();
    console.log("Movement synced successfully", { data });
    return data;
  }
};

const ApiService = {
  activateDevice,
  fetchGuestsFromApi,
  syncMovementToApi,
};

export default ApiService;
