import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import type { RentalContract } from "@/types";

// Helper to generate contract number
function generateContractNumber(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `RC-${y}${m}${d}-${rand}`;
}

// GET /api/rental-contracts - Get all rental contracts
export async function GET() {
    try {
        const data = readData();
        // Initialize rentalContracts array if it doesn't exist
        if (!data.rentalContracts) {
            data.rentalContracts = [];
            writeData(data);
        }
        return NextResponse.json(data.rentalContracts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
    }
}

// POST /api/rental-contracts - Create a new rental contract
export async function POST(request: NextRequest) {
    try {
        const contract: RentalContract = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!contract.landlordName?.trim()) {
            errors.push("Landlord name is required");
        }
        if (!contract.tenantName?.trim()) {
            errors.push("Tenant name is required");
        }
        if (!contract.tenantIdPassport?.trim()) {
            errors.push("Tenant ID/Passport is required");
        }
        if (!contract.tenantPhone?.trim()) {
            errors.push("Tenant phone is required");
        }
        if (!contract.validFrom) {
            errors.push("Contract start date is required");
        }
        if (!contract.validTo) {
            errors.push("Contract end date is required");
        }
        if (!contract.monthlyRent || contract.monthlyRent <= 0) {
            errors.push("Monthly rent must be greater than 0");
        }

        // Validate dates
        if (contract.validFrom && contract.validTo) {
            const startDate = new Date(contract.validFrom);
            const endDate = new Date(contract.validTo);
            if (endDate <= startDate) {
                errors.push("Contract end date must be after start date");
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        const data = readData();

        // Initialize array if needed
        if (!data.rentalContracts) {
            data.rentalContracts = [];
        }

        // Ensure ID and contract number exist
        if (!contract.id) {
            contract.id = `rc-${Date.now()}`;
        }
        if (!contract.contractNumber) {
            contract.contractNumber = generateContractNumber();
        }

        // Set timestamps
        const now = new Date().toISOString();
        contract.createdAt = contract.createdAt || now;
        contract.updatedAt = now;

        // Set defaults
        contract.type = contract.type || "rental";
        contract.status = contract.status || "draft";

        data.rentalContracts.push(contract);
        writeData(data);

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
    }
}
