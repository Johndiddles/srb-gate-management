import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Guest } from "../types";

export const pickAndParseFile = async (): Promise<Guest[]> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "*/*",
        // "text/csv",
        // "text/comma-separated-values",
        // "application/csv",
        // "public.comma-separated-values-text",
        // "public.plain-text",
        // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // "application/vnd.ms-excel",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return [];

    const file = result.assets[0];
    const fileUri = file.uri;
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      return parseCSV(fileUri);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return parseExcel(fileUri);
    }

    throw new Error("Unsupported file format");
  } catch (error) {
    console.error("File Import Error:", error);
    throw error;
  }
};

const parseCSV = async (uri: string): Promise<Guest[]> => {
  const fileContent = new FileSystem.File(uri).textSync();

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const guests: Guest[] = results.data.map((row: any, index: number) =>
          normalizeGuest(row, index),
        );
        resolve(guests);
      },
      error: (error: any) => reject(error),
    });
  });
};

const parseExcel = async (uri: string): Promise<Guest[]> => {
  // const fileContent = await FileSystem.readAsStringAsync(uri, {
  //   encoding: FileSystem.EncodingType.Base64,
  // });
  const fileContent = new FileSystem.File(uri).base64Sync();

  const workbook = XLSX.read(fileContent, { type: "base64" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  return jsonData.map((row: any, index: number) => normalizeGuest(row, index));
};

const normalizeGuest = (row: any, index: number): Guest => {
  // Map various possible headers to our schema
  const firstName =
    row["First Name"] || row["FirstName"] || row["Given Name"] || "";
  const lastName =
    row["Last Name"] || row["LastName"] || row["Family Name"] || "";
  const room = row["RoomNum"] || row["RoomNumber"] || row["Unit"] || "Unknown";

  const rawStatus = (row["Status"] || "").toLowerCase().trim();
  let status: Guest["status"] = "arrival"; // Default

  if (rawStatus.includes("in") && rawStatus.includes("house"))
    status = "in-house";
  else if (rawStatus.includes("check") && rawStatus.includes("out"))
    status = "checked-out";
  else if (rawStatus === "arrival") status = "arrival";

  const arrivalDate =
    row["ArrivalDate"] || new Date().toISOString().split("T")[0];

  return {
    // ID composed of Room + Name + ArrivalDate for uniqueness per stay
    id: `${room}-${String(firstName).trim()}-${String(lastName).trim()}-${arrivalDate}`,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    roomNumber: String(room).trim(),
    status,
    arrivalDate: arrivalDate,
    notes: row["Notes"] || "",
  };
};
