// Hooks abstraction fulfilling the explicit DRY principle instruction by user
import { useState, useEffect } from "react";
import { Camera } from "expo-camera";

export interface StaffScannedData {
  staffId: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

export default function useStaffScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<StaffScannedData | null>(null);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    try {
      const parsed = JSON.parse(data);
      if (parsed.staffId) {
        setScannedData(parsed as StaffScannedData);
      } else {
        alert("Invalid Staff QR Data");
      }
    } catch (e) {
      if (data.startsWith("ST")) {
        setScannedData({ staffId: data });
      } else {
        alert("Invalid QR format");
      }
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScannedData(null);
  };

  return {
    hasPermission,
    scanned,
    scannedData,
    handleBarCodeScanned,
    resetScanner,
  };
}
