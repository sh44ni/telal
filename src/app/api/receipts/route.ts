import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import type { Receipt } from "@/types";

// Generate next receipt number in TPL-XXXX format
function generateReceiptNumber(receipts: Receipt[]): string {
    if (receipts.length === 0) {
        return "TPL-0001";
    }

    // Find highest number
    const numbers = receipts
        .map(r => {
            const match = r.receiptNo.match(/TPL-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `TPL-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/receipts - Get all receipts with customer and property data
export async function GET() {
    try {
        const data = readData();

        // Join receipts with customer and property data
        const receiptsWithDetails = data.receipts.map(receipt => {
            const customer = receipt.customerId
                ? data.customers.find(c => c.id === receipt.customerId)
                : undefined;
            const property = receipt.propertyId
                ? data.properties.find(p => p.id === receipt.propertyId)
                : undefined;

            return {
                ...receipt,
                customer,
                property
            };
        });

        // Sort by date descending (newest first)
        receiptsWithDetails.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json(receiptsWithDetails);
    } catch (error) {
        console.error("Error fetching receipts:", error);
        return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 });
    }
}

// POST /api/receipts - Create a new receipt
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = readData();

        // Validation
        const errors: string[] = [];

        if (!body.type) {
            errors.push("Receipt type is required");
        }

        if (!body.amount || body.amount <= 0) {
            errors.push("Amount must be greater than 0");
        }

        if (!body.paidBy || body.paidBy.trim() === "") {
            errors.push("Paid by is required");
        }

        if (!body.paymentMethod) {
            errors.push("Payment method is required");
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        // Generate receipt
        const now = new Date().toISOString();
        const receipts = (data.receipts || []).filter(r => 'receiptNo' in r) as Receipt[];
        const receipt: Receipt = {
            id: `rcpt-${Date.now()}`,
            receiptNo: generateReceiptNumber(receipts),
            type: body.type,
            amount: parseFloat(body.amount),
            paidBy: body.paidBy.trim(),
            customerId: body.customerId || undefined,
            propertyId: body.propertyId || undefined,
            rentalId: body.rentalId || undefined,
            paymentMethod: body.paymentMethod,
            reference: body.reference || undefined,
            description: body.description || "",
            date: body.date || now.split("T")[0],
            createdAt: now,
        };

        data.receipts.push(receipt);
        writeData(data);

        return NextResponse.json(receipt, { status: 201 });
    } catch (error) {
        console.error("Error creating receipt:", error);
        return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
    }
}
