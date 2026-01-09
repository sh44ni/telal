import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/sale-contracts/[id] - Get a single sale contract
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const contract = await prisma.saleContract.findUnique({
            where: { id },
            include: {
                seller: true,
                buyer: true,
            },
        });

        if (!contract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error("Error fetching sale contract:", error);
        return NextResponse.json({ error: "Failed to fetch sale contract" }, { status: 500 });
    }
}

// PUT /api/sale-contracts/[id] - Update a sale contract
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if contract exists
        const existingContract = await prisma.saleContract.findUnique({
            where: { id },
        });

        if (!existingContract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};

        if (body.status !== undefined) updateData.status = body.status.toUpperCase();
        if (body.sellerId !== undefined) updateData.sellerId = body.sellerId;
        if (body.sellerName !== undefined) updateData.sellerName = body.sellerName;
        if (body.sellerCR !== undefined) updateData.sellerCR = body.sellerCR;
        if (body.sellerNationality !== undefined) updateData.sellerNationality = body.sellerNationality;
        if (body.sellerAddress !== undefined) updateData.sellerAddress = body.sellerAddress;
        if (body.sellerPhone !== undefined) updateData.sellerPhone = body.sellerPhone;
        if (body.buyerId !== undefined) updateData.buyerId = body.buyerId;
        if (body.buyerName !== undefined) updateData.buyerName = body.buyerName;
        if (body.buyerCR !== undefined) updateData.buyerCR = body.buyerCR;
        if (body.buyerNationality !== undefined) updateData.buyerNationality = body.buyerNationality;
        if (body.buyerAddress !== undefined) updateData.buyerAddress = body.buyerAddress;
        if (body.buyerPhone !== undefined) updateData.buyerPhone = body.buyerPhone;
        if (body.propertyWilaya !== undefined) updateData.propertyWilaya = body.propertyWilaya;
        if (body.propertyGovernorate !== undefined) updateData.propertyGovernorate = body.propertyGovernorate;
        if (body.propertyPhase !== undefined) updateData.propertyPhase = body.propertyPhase;
        if (body.propertyLandNumber !== undefined) updateData.propertyLandNumber = body.propertyLandNumber;
        if (body.propertyArea !== undefined) updateData.propertyArea = body.propertyArea;
        if (body.totalPrice !== undefined) updateData.totalPrice = parseFloat(body.totalPrice);
        if (body.totalPriceWords !== undefined) updateData.totalPriceWords = body.totalPriceWords;
        if (body.depositAmount !== undefined) updateData.depositAmount = parseFloat(body.depositAmount);
        if (body.depositAmountWords !== undefined) updateData.depositAmountWords = body.depositAmountWords;
        if (body.depositDate !== undefined) updateData.depositDate = new Date(body.depositDate);
        if (body.remainingAmount !== undefined) updateData.remainingAmount = parseFloat(body.remainingAmount);
        if (body.remainingAmountWords !== undefined) updateData.remainingAmountWords = body.remainingAmountWords;
        if (body.remainingDueDate !== undefined) updateData.remainingDueDate = new Date(body.remainingDueDate);
        if (body.finalPaymentAmount !== undefined) updateData.finalPaymentAmount = parseFloat(body.finalPaymentAmount);
        if (body.finalPaymentAmountWords !== undefined) updateData.finalPaymentAmountWords = body.finalPaymentAmountWords;
        if (body.constructionStartDate !== undefined) updateData.constructionStartDate = new Date(body.constructionStartDate);
        if (body.constructionEndDate !== undefined) updateData.constructionEndDate = new Date(body.constructionEndDate);
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.sellerSignature !== undefined) updateData.sellerSignature = body.sellerSignature;
        if (body.buyerSignature !== undefined) updateData.buyerSignature = body.buyerSignature;
        if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl;

        const updatedContract = await prisma.saleContract.update({
            where: { id },
            data: updateData,
            include: {
                seller: true,
                buyer: true,
            },
        });

        return NextResponse.json(updatedContract);
    } catch (error) {
        console.error("Error updating sale contract:", error);
        return NextResponse.json({ error: "Failed to update sale contract" }, { status: 500 });
    }
}

// DELETE /api/sale-contracts/[id] - Delete a sale contract
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        // Check if contract exists
        const existingContract = await prisma.saleContract.findUnique({
            where: { id },
        });

        if (!existingContract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        await prisma.saleContract.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting sale contract:", error);
        return NextResponse.json({ error: "Failed to delete sale contract" }, { status: 500 });
    }
}
