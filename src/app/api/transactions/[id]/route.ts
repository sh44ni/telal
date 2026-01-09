import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/transactions/[id] - Get single transaction
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                customer: true,
                property: true,
                project: true,
                rental: true,
            },
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
    }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if transaction exists
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id },
        });

        if (!existingTransaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};

        if (body.projectId !== undefined) updateData.projectId = body.projectId;
        if (body.propertyId !== undefined) updateData.propertyId = body.propertyId;
        if (body.customerId !== undefined) updateData.customerId = body.customerId;
        if (body.category !== undefined) updateData.category = body.category.toUpperCase();
        if (body.type !== undefined) updateData.type = body.type;
        if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
        if (body.paidBy !== undefined) updateData.paidBy = body.paidBy;
        if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod.toUpperCase();
        if (body.isSaleTransaction !== undefined) updateData.isSaleTransaction = body.isSaleTransaction;
        if (body.saleDetails !== undefined) updateData.saleDetails = body.saleDetails;
        if (body.rentalId !== undefined) updateData.rentalId = body.rentalId;
        if (body.reference !== undefined) updateData.reference = body.reference;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.date !== undefined) updateData.date = new Date(body.date);

        const transaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
            include: {
                customer: true,
                property: true,
                project: true,
                rental: true,
            },
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
    }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        // Check if transaction exists
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id },
        });

        if (!existingTransaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        await prisma.transaction.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
    }
}
