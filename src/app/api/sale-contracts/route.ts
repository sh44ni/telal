import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Generate contract number in SC-YYYYMMDD-XXX format
async function generateContractNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

    // Find existing contracts from today
    const todayContracts = await prisma.saleContract.findMany({
        where: {
            contractNumber: {
                startsWith: `SC-${dateStr}`,
            },
        },
    });

    const nextNumber = todayContracts.length + 1;
    return `SC-${dateStr}-${nextNumber.toString().padStart(3, "0")}`;
}

// GET /api/sale-contracts - Get all sale contracts
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const saleContracts = await prisma.saleContract.findMany({
            include: {
                seller: true,
                buyer: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(saleContracts);
    } catch (error) {
        console.error("Error fetching sale contracts:", error);
        return NextResponse.json({ error: "Failed to fetch sale contracts" }, { status: 500 });
    }
}

// POST /api/sale-contracts - Create new sale contract
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

        // Generate contract number
        const contractNumber = body.contractNumber || await generateContractNumber();

        // Convert status to uppercase enum value
        const status = body.status ? body.status.toUpperCase() : 'SIGNED';

        const newContract = await prisma.saleContract.create({
            data: {
                contractNumber,
                type: 'SALE',
                status,
                // Seller - use provided ID or null
                sellerId: undefined, // undefined REMOVES it from the query
                sellerCivilId: body.sellerId, // Store the input ID here
                sellerName: body.sellerName,
                sellerCR: body.sellerCR || null,
                sellerNationality: body.sellerNationality || "",
                sellerAddress: body.sellerAddress || "",
                sellerPhone: body.sellerPhone || "",
                // Buyer - use provided ID or null
                buyerId: undefined, // undefined REMOVES it from the query
                buyerCivilId: body.buyerId, // Store the input ID here
                buyerName: body.buyerName,
                buyerCR: body.buyerCR || null,
                buyerNationality: body.buyerNationality || "",
                buyerAddress: body.buyerAddress || "",
                buyerPhone: body.buyerPhone || "",
                // Property
                propertyWilaya: body.propertyWilaya || "",
                propertyGovernorate: body.propertyGovernorate || "",
                propertyPhase: body.propertyPhase || "",
                propertyLandNumber: body.propertyLandNumber || "",
                propertyArea: body.propertyArea || "",
                // Payment
                totalPrice: parseFloat(body.totalPrice) || 0,
                totalPriceWords: body.totalPriceWords || "",
                depositAmount: parseFloat(body.depositAmount) || 0,
                depositAmountWords: body.depositAmountWords || "",
                depositDate: body.depositDate ? new Date(body.depositDate) : new Date(),
                remainingAmount: parseFloat(body.remainingAmount) || 0,
                remainingAmountWords: body.remainingAmountWords || "",
                remainingDueDate: body.remainingDueDate ? new Date(body.remainingDueDate) : new Date(),
                finalPaymentAmount: parseFloat(body.finalPaymentAmount) || 0,
                finalPaymentAmountWords: body.finalPaymentAmountWords || "",
                // Construction
                constructionStartDate: body.constructionStartDate ? new Date(body.constructionStartDate) : new Date(),
                constructionEndDate: body.constructionEndDate ? new Date(body.constructionEndDate) : new Date(),
                notes: body.notes || null,
                // Signatures
                sellerSignature: body.sellerSignature || "",
                buyerSignature: body.buyerSignature || "",
                // Meta
                pdfUrl: body.pdfUrl || null,
            },
        });

        return NextResponse.json(newContract, { status: 201 });
    } catch (error) {
        console.error("Error creating sale contract:", error);
        return NextResponse.json({ error: "Failed to create sale contract" }, { status: 500 });
    }
}
