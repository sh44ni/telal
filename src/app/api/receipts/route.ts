import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Generate next receipt number in TPL-XXXX format
async function generateReceiptNumber(): Promise<string> {
    const receipts = await prisma.receipt.findMany({
        orderBy: { receiptNo: 'desc' },
        take: 1,
    });

    if (!receipts || receipts.length === 0) {
        return "TPL-0001";
    }

    const lastReceiptNo = receipts[0].receiptNo;
    const match = lastReceiptNo?.match(/TPL-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;

    return `TPL-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/receipts - Get all receipts with rental data
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const receipts = await prisma.receipt.findMany({
            include: {
                rental: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(receipts);
    } catch (error) {
        console.error("Error fetching receipts:", error);
        return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 });
    }
}

// POST /api/receipts - Create a new receipt
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

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

        // Generate receipt number
        const receiptNo = body.receiptNo || await generateReceiptNumber();

        // Convert payment method to uppercase enum value
        const paymentMethod = body.paymentMethod.toUpperCase();

        const receipt = await prisma.receipt.create({
            data: {
                receiptNo,
                type: body.type,
                amount: parseFloat(body.amount),
                paidBy: body.paidBy.trim(),
                customerId: body.customerId || null,
                propertyId: body.propertyId || null,
                projectId: body.projectId || null,
                rentalId: body.rentalId || null,
                paymentMethod,
                reference: body.reference || null,
                description: body.description || '',
                date: body.date ? new Date(body.date) : new Date(),
            },
            include: {
                rental: true,
            },
        });

        return NextResponse.json(receipt, { status: 201 });
    } catch (error) {
        console.error("Error creating receipt:", error);
        return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
    }
}
