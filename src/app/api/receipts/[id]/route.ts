import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";

// GET /api/receipts/[id] - Get a single receipt
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = readData();

        const receipt = data.receipts.find(r => r.id === id);

        if (!receipt) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        // Add related data
        const customer = receipt.customerId
            ? data.customers.find(c => c.id === receipt.customerId)
            : undefined;
        const property = receipt.propertyId
            ? data.properties.find(p => p.id === receipt.propertyId)
            : undefined;

        return NextResponse.json({
            ...receipt,
            customer,
            property
        });
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
    try {
        const { id } = await params;
        const body = await request.json();
        const data = readData();

        const index = data.receipts.findIndex(r => r.id === id);

        if (index === -1) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        // Update receipt (preserve id and receiptNo)
        const existingReceipt = data.receipts[index];
        const updatedReceipt = {
            ...existingReceipt,
            type: body.type || existingReceipt.type,
            amount: body.amount ? parseFloat(body.amount) : existingReceipt.amount,
            paidBy: body.paidBy || existingReceipt.paidBy,
            customerId: body.customerId !== undefined ? body.customerId : existingReceipt.customerId,
            propertyId: body.propertyId !== undefined ? body.propertyId : existingReceipt.propertyId,
            rentalId: body.rentalId !== undefined ? body.rentalId : existingReceipt.rentalId,
            paymentMethod: body.paymentMethod || existingReceipt.paymentMethod,
            reference: body.reference !== undefined ? body.reference : existingReceipt.reference,
            description: body.description !== undefined ? body.description : existingReceipt.description,
            date: body.date || existingReceipt.date,
        };

        data.receipts[index] = updatedReceipt;
        writeData(data);

        return NextResponse.json(updatedReceipt);
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
    try {
        const { id } = await params;
        const data = readData();

        const index = data.receipts.findIndex(r => r.id === id);

        if (index === -1) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        data.receipts.splice(index, 1);
        writeData(data);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting receipt:", error);
        return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
    }
}
