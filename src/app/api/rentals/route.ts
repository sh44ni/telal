import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Generate rental ID in RNT-XXXX format
async function generateRentalId(): Promise<string> {
    const rentals = await prisma.rental.findMany({
        orderBy: { rentalId: 'desc' },
        take: 1,
    });

    if (!rentals || rentals.length === 0) {
        return "RNT-0001";
    }

    const lastRentalId = rentals[0].rentalId;
    const match = lastRentalId?.match(/RNT-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;

    return `RNT-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/rentals - Get all rentals with tenant and property data
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const rentals = await prisma.rental.findMany({
            include: {
                tenant: true,
                property: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(rentals);
    } catch (error) {
        console.error("Error fetching rentals:", error);
        return NextResponse.json({ error: "Failed to fetch rentals" }, { status: 500 });
    }
}

// POST /api/rentals - Create a new rental
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!body.propertyId) {
            errors.push("Property is required");
        } else {
            // Check if property exists
            const propertyExists = await prisma.property.findUnique({
                where: { id: body.propertyId },
            });
            if (!propertyExists) {
                errors.push("Selected property does not exist");
            }
        }

        if (!body.tenantId) {
            errors.push("Tenant is required");
        } else {
            // Check if tenant exists
            const tenantExists = await prisma.customer.findUnique({
                where: { id: body.tenantId },
            });
            if (!tenantExists) {
                errors.push("Selected tenant does not exist");
            }
        }

        if (!body.monthlyRent || body.monthlyRent <= 0) {
            errors.push("Monthly rent must be greater than 0");
        }

        if (!body.leaseStart) {
            errors.push("Lease start date is required");
        }

        if (!body.leaseEnd) {
            errors.push("Lease end date is required");
        }

        // Validate lease dates
        if (body.leaseStart && body.leaseEnd) {
            const startDate = new Date(body.leaseStart);
            const endDate = new Date(body.leaseEnd);
            if (endDate <= startDate) {
                errors.push("Lease end date must be after start date");
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        // Generate rental ID if not present
        const rentalId = body.rentalId || await generateRentalId();

        // Convert payment status to uppercase enum value
        const paymentStatus = body.paymentStatus ? body.paymentStatus.toUpperCase() : 'UNPAID';

        const rental = await prisma.rental.create({
            data: {
                rentalId,
                propertyId: body.propertyId,
                tenantId: body.tenantId,
                monthlyRent: body.monthlyRent,
                depositAmount: body.depositAmount || 0,
                leaseStart: new Date(body.leaseStart),
                leaseEnd: new Date(body.leaseEnd),
                dueDay: body.dueDay || 1,
                paymentStatus,
                paidUntil: new Date(body.paidUntil || body.leaseStart),
                notes: body.notes || null,
            },
            include: {
                tenant: true,
                property: true,
            },
        });

        return NextResponse.json(rental, { status: 201 });
    } catch (error) {
        console.error("Error creating rental:", error);
        return NextResponse.json({ error: "Failed to create rental" }, { status: 500 });
    }
}
