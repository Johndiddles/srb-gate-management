import { useGateStore } from "../store/useGateStore";
import type { Guest, PhoneBoothAssignment } from "../types";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const getHeaders = () => {
  const token = useGateStore.getState().deviceToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface QueryFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  name?: string;
  department?: string;
  licensePlate?: string;
  staffId?: string;
  status?: string;
}

const buildQueryParams = (filters?: QueryFilters) => {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
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

export const validateLicensePing = async () => {
  const res = await fetch(`${API_BASE_URL}/licenses/ping`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
};

export const fetchGuestsFromApi = async (
  filters?: QueryFilters,
): Promise<Guest[]> => {
  const res = await fetch(
    `${API_BASE_URL}/guests${buildQueryParams(filters)}`,
    {
      headers: getHeaders(),
    },
  );
  const data = await handleResponse(res);
  return data || [];
};

const fetchDeviceMovements = async (filters?: QueryFilters) => {
  const res = await fetch(
    `${API_BASE_URL}/movements${buildQueryParams(filters)}`,
    {
      headers: getHeaders(),
    },
  );
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

export const fetchStaffShiftsApi = async (filters?: QueryFilters) => {
  const res = await fetch(
    `${API_BASE_URL}/movements/staff-shifts${buildQueryParams(filters)}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
};

export const syncStaffShiftsApi = async (body: any) => {
  const res = await fetch(`${API_BASE_URL}/movements/staff-shifts/sync`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

export const updateGuestStatusApi = async (guestId: string, status: string) => {
  const res = await fetch(`${API_BASE_URL}/guests/${guestId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

export const fetchPhoneBoothAssignmentsApi = async (
  filters?: QueryFilters,
): Promise<PhoneBoothAssignment[]> => {
  const res = await fetch(
    `${API_BASE_URL}/phone-booth${buildQueryParams(filters)}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
};

export const syncPhoneBoothAssignmentToApi = async (body: any) => {
  const res = await fetch(`${API_BASE_URL}/phone-booth`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

export const fetchKeyCollectionsApi = async (
  filters?: QueryFilters,
): Promise<any[]> => {
  const res = await fetch(
    `${API_BASE_URL}/keys${buildQueryParams(filters)}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
};

export const syncKeyCollectionToApi = async (body: any) => {
  const res = await fetch(`${API_BASE_URL}/keys`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};

const ApiService = {
  activateDevice,
  fetchGuestsFromApi,
  syncMovementToApi,
  fetchDeviceMovements,
  fetchStaffShiftsApi,
  syncStaffShiftsApi,
  updateGuestStatusApi,
  fetchPhoneBoothAssignmentsApi,
  syncPhoneBoothAssignmentToApi,
  fetchKeyCollectionsApi,
  syncKeyCollectionToApi,
};

export default ApiService;
