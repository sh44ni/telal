import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";

// GET /api/transactions/[id] - Get single transaction
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = readData();

        const transaction = data.receipts?.find(t => t.id === id);

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Join with related data
        const transactionWithDetails = {
            ...transaction,
            customer: data.customers.find(c => c.id === transaction.customerId),
            property: data.properties.find(p => p.id === transaction.propertyId),
            project: data.projects.find(p => p.id === transaction.projectId),
        };

        return NextResponse.json(transactionWithDetails);
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
    try {
        const { id } = await params;
        const body = await request.json();
        const data = readData();

        const index = data.receipts?.findIndex(t => t.id === id);

        if (index === undefined || index === -1) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Update transaction
        data.receipts[index] = {
            ...data.receipts[index],
            ...body,
            updatedAt: new Date().toISOString(),
        };

        writeData(data);

        return NextResponse.json(data.receipts[index]);
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
    try {
        const { id } = await params;
        const data = readData();

        const index = data.receipts?.findIndex(t => t.id === id);

        if (index === undefined || index === -1) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Remove transaction
        data.receipts.splice(index, 1);
        writeData(data);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
    }
}
