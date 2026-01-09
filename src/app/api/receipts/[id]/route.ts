import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/receipts/[id] - Get a single receipt
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        const receipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                rental: true,
            },
        });

        if (!receipt) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        return NextResponse.json(receipt);
    } catch (error) {
        console.error("Error fetching receipt:", error);
        return NextResponse.json({ error: "Failed to fetch receipt" }, { status: 500 });
    }
}

// PUT /api/receipts/[id] - Update a receipt
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if receipt exists
        const existingReceipt = await prisma.receipt.findUnique({
            where: { id },
        });

        if (!existingReceipt) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};

        if (body.type !== undefined) updateData.type = body.type;
        if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
        if (body.paidBy !== undefined) updateData.paidBy = body.paidBy;
        if (body.customerId !== undefined) updateData.customerId = body.customerId;
        if (body.propertyId !== undefined) updateData.propertyId = body.propertyId;
        if (body.projectId !== undefined) updateData.projectId = body.projectId;
        if (body.rentalId !== undefined) updateData.rentalId = body.rentalId;
        if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod.toUpperCase();
        if (body.reference !== undefined) updateData.reference = body.reference;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.date !== undefined) updateData.date = new Date(body.date);

        const receipt = await prisma.receipt.update({
            where: { id },
            data: updateData,
            include: {
                rental: true,
            },
        });

        return NextResponse.json(receipt);
    } catch (error) {
        console.error("Error updating receipt:", error);
        return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 });
    }
}

// DELETE /api/receipts/[id] - Delete a receipt
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        // Check if receipt exists
        const existingReceipt = await prisma.receipt.findUnique({
            where: { id },
        });

        if (!existingReceipt) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        await prisma.receipt.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting receipt:", error);
        return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
    }
}
