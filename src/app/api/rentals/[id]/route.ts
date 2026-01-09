import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/rentals/[id] - Get a single rental
export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const rental = await prisma.rental.findUnique({
            where: { id },
            include: {
                tenant: true,
                property: true,
            },
        });

        if (!rental) {
            return NextResponse.json({ error: "Rental not found" }, { status: 404 });
        }

        return NextResponse.json(rental);
    } catch (error) {
        console.error("Error fetching rental:", error);
        return NextResponse.json({ error: "Failed to fetch rental" }, { status: 500 });
    }
}

// PUT /api/rentals/[id] - Update a rental
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if rental exists
        const existingRental = await prisma.rental.findUnique({
            where: { id },
        });

        if (!existingRental) {
            return NextResponse.json({ error: "Rental not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};

        if (body.propertyId !== undefined) updateData.propertyId = body.propertyId;
        if (body.tenantId !== undefined) updateData.tenantId = body.tenantId;
        if (body.monthlyRent !== undefined) updateData.monthlyRent = body.monthlyRent;
        if (body.depositAmount !== undefined) updateData.depositAmount = body.depositAmount;
        if (body.leaseStart !== undefined) updateData.leaseStart = new Date(body.leaseStart);
        if (body.leaseEnd !== undefined) updateData.leaseEnd = new Date(body.leaseEnd);
        if (body.dueDay !== undefined) updateData.dueDay = body.dueDay;
        if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus.toUpperCase();
        if (body.paidUntil !== undefined) updateData.paidUntil = new Date(body.paidUntil);
        if (body.notes !== undefined) updateData.notes = body.notes;

        const rental = await prisma.rental.update({
            where: { id },
            data: updateData,
            include: {
                tenant: true,
                property: true,
            },
        });

        return NextResponse.json(rental);
    } catch (error) {
        console.error("Error updating rental:", error);
        return NextResponse.json({ error: "Failed to update rental" }, { status: 500 });
    }
}

// DELETE /api/rentals/[id] - Delete a rental
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        // Check if rental exists
        const existingRental = await prisma.rental.findUnique({
            where: { id },
        });

        if (!existingRental) {
            return NextResponse.json({ error: "Rental not found" }, { status: 404 });
        }

        await prisma.rental.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Rental deleted successfully" });
    } catch (error) {
        console.error("Error deleting rental:", error);
        return NextResponse.json({ error: "Failed to delete rental" }, { status: 500 });
    }
}
