import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Generate transaction number in TPL-XXXX format
async function generateTransactionNumber(): Promise<string> {
    const transactions = await prisma.transaction.findMany({
        orderBy: { transactionNo: 'desc' },
        take: 1,
    });

    if (!transactions || transactions.length === 0) {
        return "TPL-0001";
    }

    const lastTransactionNo = transactions[0].transactionNo;
    const match = lastTransactionNo?.match(/TPL-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;

    return `TPL-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/transactions - Get all transactions
export async function GET(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const type = searchParams.get("type");
        const propertyId = searchParams.get("propertyId");

        // Build query with optional filters
        const where: any = {};

        if (category) {
            where.category = category.toUpperCase();
        }

        if (type) {
            where.type = type;
        }

        if (propertyId) {
            where.propertyId = propertyId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                customer: true,
                property: true,
                project: true,
                rental: true,
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

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

        // Generate transaction number
        const transactionNo = body.transactionNo || await generateTransactionNumber();

        // Get customer name for paidBy if not provided
        let paidBy = body.paidBy || "Unknown";
        if (body.customerId && !body.paidBy) {
            const customer = await prisma.customer.findUnique({
                where: { id: body.customerId },
            });
            paidBy = customer?.name || "Unknown";
        }

        // Convert category and payment method to uppercase enum values
        const category = body.category ? body.category.toUpperCase() : 'INCOME';
        const paymentMethod = body.paymentMethod ? body.paymentMethod.toUpperCase() : 'CASH';

        // Create new transaction
        const newTransaction = await prisma.transaction.create({
            data: {
                transactionNo,
                projectId: body.projectId,
                propertyId: body.propertyId,
                customerId: body.customerId,
                category,
                type: body.type || "rent_payment",
                amount: parseFloat(body.amount),
                paidBy,
                paymentMethod,
                isSaleTransaction: body.isSaleTransaction || body.type === "sale_payment",
                saleDetails: body.saleDetails || null,
                rentalId: body.rentalId || null,
                reference: body.reference || null,
                description: body.description || "",
                date: body.date ? new Date(body.date) : new Date(),
            },
            include: {
                customer: true,
                property: true,
                project: true,
                rental: true,
            },
        });

        // Handle sale transaction - auto-mark property as sold
        if (body.type === "sale_payment" && body.saleDetails) {
            const property = await prisma.property.findUnique({
                where: { id: body.propertyId },
            });

            if (property) {
                // Check if this is the first sale payment for this property
                const existingSalePayments = await prisma.transaction.findMany({
                    where: {
                        propertyId: body.propertyId,
                        type: "sale_payment",
                    },
                });

                if (existingSalePayments.length === 1) {
                    // First sale payment - mark property as sold
                    await prisma.property.update({
                        where: { id: body.propertyId },
                        data: {
                            status: 'SOLD',
                            saleInfo: {
                                buyerId: body.customerId,
                                saleDate: body.date || new Date().toISOString().split("T")[0],
                                totalPrice: body.saleDetails.totalPrice,
                                paidAmount: parseFloat(body.amount),
                                remainingAmount: body.saleDetails.totalPrice - parseFloat(body.amount),
                                paymentStatus: parseFloat(body.amount) >= body.saleDetails.totalPrice ? "completed" : "partial",
                            },
                        },
                    });
                } else {
                    // Subsequent payment - update totals
                    const saleInfo = property.saleInfo as any;
                    if (saleInfo) {
                        const newPaidAmount = (saleInfo.paidAmount || 0) + parseFloat(body.amount);
                        const newRemainingAmount = (saleInfo.totalPrice || 0) - newPaidAmount;

                        await prisma.property.update({
                            where: { id: body.propertyId },
                            data: {
                                saleInfo: {
                                    ...saleInfo,
                                    paidAmount: newPaidAmount,
                                    remainingAmount: newRemainingAmount,
                                    paymentStatus: newRemainingAmount <= 0 ? "completed" : "partial",
                                },
                            },
                        });
                    }
                }
            }
        }

        // Update rental if it's a rent payment
        if (body.type === "rent_payment" && body.rentalId) {
            const rental = await prisma.rental.findUnique({
                where: { id: body.rentalId },
            });

            if (rental) {
                // Calculate how many months this payment covers
                const monthsCovered = Math.floor(parseFloat(body.amount) / rental.monthlyRent);

                // Update paidUntil date
                const currentPaidUntil = new Date(rental.paidUntil);
                currentPaidUntil.setMonth(currentPaidUntil.getMonth() + monthsCovered);

                // Update payment status
                const today = new Date();
                const paymentStatus = currentPaidUntil >= today ? 'PAID' : 'OVERDUE';

                await prisma.rental.update({
                    where: { id: body.rentalId },
                    data: {
                        paidUntil: currentPaidUntil,
                        paymentStatus,
                    },
                });
            }
        }

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }
}
