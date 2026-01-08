import fs from "fs";
import path from "path";
import type { Database, Project, Property, Customer, Rental, Receipt, Contract, Document, RentalContract, Transaction } from "@/types";

// Database file path - stored in the project root
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Default empty database
const defaultData: Database = {
    users: [],
    projects: [],
    properties: [],
    customers: [],
    rentals: [],
    receipts: [],
    contracts: [],
    documents: [],
    rentalContracts: [],
    transactions: [],
};

// Ensure the data directory exists
function ensureDataDir() {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Read data from JSON file
export function readData(): Database {
    try {
        ensureDataDir();
        if (!fs.existsSync(DB_PATH)) {
            // Create default file if it doesn't exist
            writeData(defaultData);
            return defaultData;
        }
        const fileContent = fs.readFileSync(DB_PATH, "utf-8");
        return JSON.parse(fileContent) as Database;
    } catch (error) {
        console.error("Error reading database:", error);
        return defaultData;
    }
}

// Write data to JSON file
export function writeData(data: Database): void {
    try {
        ensureDataDir();
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
        console.error("Error writing database:", error);
        throw error;
    }
}
