import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Generate customer ID in CUS-XXXX format
async function generateCustomerId(): Promise<string> {
    const customers = await prisma.customer.findMany({
        orderBy: { customerId: 'desc' },
        take: 1,
    });

    if (!customers || customers.length === 0) {
        return "CUS-0001";
    }

    const lastCustomerId = customers[0].customerId;
    const match = lastCustomerId?.match(/CUS-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;

    return `CUS-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
    // Protect route
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");

        // Build query with optional search filter
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { customerId: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {};

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
    // Protect route
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!body.name?.trim()) {
            errors.push("Customer name is required");
        }
        if (!body.type) {
            errors.push("Customer type is required");
        }
        if (!body.phone?.trim()) {
            errors.push("Phone number is required");
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        // Auto-generate customerId if not provided
        const customerId = body.customerId || await generateCustomerId();

        // Convert customer type to uppercase enum value
        const customerType = body.type.toUpperCase();

        const customer = await prisma.customer.create({
            data: {
                customerId,
                name: body.name.trim(),
                type: customerType,
                email: body.email?.trim() || null,
                phone: body.phone.trim(),
                alternatePhone: body.alternatePhone?.trim() || null,
                address: body.address || '',
                emiratesId: body.emiratesId || null,
                passportNo: body.passportNo || null,
                nationality: body.nationality || null,
                notes: body.notes || null,
                assignedPropertyIds: body.assignedPropertyIds || [],
            },
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
