import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import type { Transaction } from "@/types";

// Generate transaction number in TPL-XXXX format
function generateTransactionNumber(transactions: Transaction[]): string {
    if (!transactions || transactions.length === 0) {
        return "TPL-0001";
    }

    const numbers = transactions
        .map(t => {
            const match = t.transactionNo?.match(/TPL-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `TPL-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/transactions - Get all transactions
export async function GET(request: NextRequest) {
    try {
        const data = readData();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const type = searchParams.get("type");
        const propertyId = searchParams.get("propertyId");

        // Cast receipts to any[] since it can contain both Receipt and Transaction
        let transactions = (data.receipts || []) as any[];

        // Filter by category (only Transaction objects have category)
        if (category) {
            transactions = transactions.filter(t => t.category === category);
        }

        // Filter by type
        if (type) {
            transactions = transactions.filter(t => t.type === type);
        }

        // Filter by property
        if (propertyId) {
            transactions = transactions.filter(t => t.propertyId === propertyId);
        }

        // Join with related data
        const transactionsWithDetails = transactions.map(transaction => ({
            ...transaction,
            customer: data.customers.find(c => c.id === transaction.customerId),
            property: data.properties.find(p => p.id === transaction.propertyId),
            project: data.projects.find(p => p.id === transaction.projectId),
        }));

        // Sort by date descending (newest first)
        transactionsWithDetails.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json(transactionsWithDetails);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = readData();

        // Validate required fields
        // Customer is only required for income transactions
        if (body.category === "income" && !body.customerId) {
            return NextResponse.json({ error: "Customer is required for income" }, { status: 400 });
        }
        // Paid To is required for expense transactions
        if (body.category === "expense" && !body.paidBy) {
            return NextResponse.json({ error: "Paid To is required for expenses" }, { status: 400 });
        }
        if (!body.propertyId) {
            return NextResponse.json({ error: "Property is required" }, { status: 400 });
        }
        if (!body.projectId) {
            return NextResponse.json({ error: "Project is required" }, { status: 400 });
        }
        if (!body.amount || body.amount <= 0) {
            return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
        }

        // Initialize receipts array if it doesn't exist
        if (!data.receipts) {
            data.receipts = [];
        }

        // Generate transaction number
        const transactionNo = generateTransactionNumber((data.receipts || []) as any[]);

        // Get customer name for paidBy if not provided
        const customer = data.customers.find(c => c.id === body.customerId);
        const paidBy = body.paidBy || customer?.name || "Unknown";

        // Create new transaction
        const newTransaction: Transaction = {
            id: `txn-${Date.now()}`,
            transactionNo,
            projectId: body.projectId,
            propertyId: body.propertyId,
            customerId: body.customerId,
            category: body.category || "income",
            type: body.type || "rent_payment",
            amount: parseFloat(body.amount),
            paidBy,
            paymentMethod: body.paymentMethod || "cash",
            isSaleTransaction: body.isSaleTransaction || body.type === "sale_payment",
            saleDetails: body.saleDetails,
            rentalId: body.rentalId,
            reference: body.reference,
            description: body.description || "",
            date: body.date || new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString(),
        };

        // Handle sale transaction - auto-mark property as sold
        if (body.type === "sale_payment" && body.saleDetails) {
            const property = data.properties.find(p => p.id === body.propertyId);

            if (property) {
                // Check if this is the first sale payment for this property
                const existingSalePayments = data.receipts.filter(
                    t => t.propertyId === body.propertyId && t.type === "sale_payment"
                );

                if (existingSalePayments.length === 0) {
                    // First sale payment - mark property as sold
                    property.status = "sold";
                    property.saleInfo = {
                        buyerId: body.customerId,
                        saleDate: body.date || new Date().toISOString().split("T")[0],
                        totalPrice: body.saleDetails.totalPrice,
                        paidAmount: parseFloat(body.amount),
                        remainingAmount: body.saleDetails.totalPrice - parseFloat(body.amount),
                        paymentStatus: parseFloat(body.amount) >= body.saleDetails.totalPrice ? "completed" : "partial",
                    };
                } else {
                    // Subsequent payment - update totals
                    if (property.saleInfo) {
                        property.saleInfo.paidAmount += parseFloat(body.amount);
                        property.saleInfo.remainingAmount = property.saleInfo.totalPrice - property.saleInfo.paidAmount;
                        property.saleInfo.paymentStatus = property.saleInfo.remainingAmount <= 0 ? "completed" : "partial";
                    }
                }

                // Update the property in the array
                const propertyIndex = data.properties.findIndex(p => p.id === body.propertyId);
                if (propertyIndex !== -1) {
                    data.properties[propertyIndex] = property;
                }
            }
        }

        // Add transaction to database
        data.receipts.push(newTransaction);
        writeData(data);

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }
}
