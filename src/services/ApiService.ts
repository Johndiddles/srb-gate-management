import { useGateStore } from "../store/useGateStore";
import { Guest } from "../types";

// export const API_BASE_URL = "http://localhost:3000/api";
export const API_BASE_URL = "http://192.168.0.102:3000/api";

const getHeaders = () => {
  const token = useGateStore.getState().deviceToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 401 || res.status === 299) {
    useGateStore.getState().deactivateProvider();
    throw new Error("License revoked or unauthorized. Deactivating device.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "API request failed");
  }
  return res.json();
};

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

  return handleResponse(res); // { message, permissions, token }
};

export const fetchGuestsFromApi = async (): Promise<Guest[]> => {
  const res = await fetch(`${API_BASE_URL}/guests`, {
    headers: getHeaders(),
  });
  const data = await handleResponse(res);
  return data || [];
};

export const syncMovementToApi = async (body: any) => {
  console.log("Syncing movement to API...", { body });
  const res = await fetch(`${API_BASE_URL}/movements`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await handleResponse(res);
  console.log("Movement synced successfully", { data });
  return data;
};

const ApiService = {
  activateDevice,
  fetchGuestsFromApi,
  syncMovementToApi,
};

export default ApiService;
