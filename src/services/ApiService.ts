import { useGateStore } from "../store/useGateStore";
import { Guest } from "../types";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const getHeaders = () => {
  const token = useGateStore.getState().deviceToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 299) {
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

const fetchDeviceMovements = async () => {
  const res = await fetch(`${API_BASE_URL}/movements`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const syncMovementToApi = async (body: any) => {
  const res = await fetch(`${API_BASE_URL}/movements`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await handleResponse(res);
  return data;
};

const ApiService = {
  activateDevice,
  fetchGuestsFromApi,
  syncMovementToApi,
  fetchDeviceMovements,
};

export default ApiService;
