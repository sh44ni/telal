import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import type { Customer } from "@/types";

// GET /api/customers - Get all customers
export async function GET() {
    // Protect route
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const data = readData();
        return NextResponse.json(data.customers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
    // Protect route
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const customer: Customer = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!customer.name?.trim()) {
            errors.push("Customer name is required");
        }
        if (!customer.type) {
            errors.push("Customer type is required");
        }
        if (!customer.phone?.trim()) {
            errors.push("Phone number is required");
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        const data = readData();

        // Ensure ID exists
        if (!customer.id) {
            customer.id = `cust-${Date.now()}`;
        }

        // Set timestamps
        const now = new Date().toISOString();
        customer.createdAt = customer.createdAt || now;
        customer.updatedAt = now;

        // Set defaults
        customer.assignedPropertyIds = customer.assignedPropertyIds || [];

        data.customers.push(customer);
        writeData(data);

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
