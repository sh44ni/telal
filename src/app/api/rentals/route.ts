import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import type { Rental } from "@/types";

// GET /api/rentals - Get all rentals with tenant and property data
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const data = readData();
        // Join rentals with tenant and property data
        const rentalsWithDetails = data.rentals.map(rental => {
            const tenant = data.customers.find(c => c.id === rental.tenantId);
            const property = data.properties.find(p => p.id === rental.propertyId);
            return {
                ...rental,
                tenant,
                property
            };
        });
        return NextResponse.json(rentalsWithDetails);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch rentals" }, { status: 500 });
    }
}

// POST /api/rentals - Create a new rental
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const rental: Rental = await request.json();
        const data = readData();

        // Validation - required fields
        const errors: string[] = [];

        if (!rental.propertyId) {
            errors.push("Property is required");
        } else {
            // Check if property exists
            const propertyExists = data.properties.some(p => p.id === rental.propertyId);
            if (!propertyExists) {
                errors.push("Selected property does not exist");
            }
        }

        if (!rental.tenantId) {
            errors.push("Tenant is required");
        } else {
            // Check if tenant exists
            const tenantExists = data.customers.some(c => c.id === rental.tenantId);
            if (!tenantExists) {
                errors.push("Selected tenant does not exist");
            }
        }

        if (!rental.monthlyRent || rental.monthlyRent <= 0) {
            errors.push("Monthly rent must be greater than 0");
        }

        if (!rental.leaseStart) {
            errors.push("Lease start date is required");
        }

        if (!rental.leaseEnd) {
            errors.push("Lease end date is required");
        }

        // Validate lease dates
        if (rental.leaseStart && rental.leaseEnd) {
            const startDate = new Date(rental.leaseStart);
            const endDate = new Date(rental.leaseEnd);
            if (endDate <= startDate) {
                errors.push("Lease end date must be after start date");
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        // Ensure ID exists
        if (!rental.id) {
            rental.id = `rent-${Date.now()}`;
        }

        // Set timestamps
        const now = new Date().toISOString();
        rental.createdAt = rental.createdAt || now;
        rental.updatedAt = now;

        // Set defaults
        rental.paymentStatus = rental.paymentStatus || "unpaid";
        rental.paidUntil = rental.paidUntil || rental.leaseStart;
        rental.dueDay = rental.dueDay || 1;

        data.rentals.push(rental);
        writeData(data);

        return NextResponse.json(rental, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create rental" }, { status: 500 });
    }
}
