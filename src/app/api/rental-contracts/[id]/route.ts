import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/rental-contracts/[id] - Get a single contract
export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const contract = await prisma.rentalContract.findUnique({
            where: { id },
        });

        if (!contract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error("Error fetching contract:", error);
        return NextResponse.json({ error: "Failed to fetch contract" }, { status: 500 });
    }
}

// PUT /api/rental-contracts/[id] - Update a contract
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if contract exists
        const existingContract = await prisma.rentalContract.findUnique({
            where: { id },
        });

        if (!existingContract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};

        if (body.status !== undefined) updateData.status = body.status.toUpperCase();
        if (body.landlordName !== undefined) updateData.landlordName = body.landlordName;
        if (body.landlordCR !== undefined) updateData.landlordCR = body.landlordCR;
        if (body.landlordPOBox !== undefined) updateData.landlordPOBox = body.landlordPOBox;
        if (body.landlordPostalCode !== undefined) updateData.landlordPostalCode = body.landlordPostalCode;
        if (body.landlordAddress !== undefined) updateData.landlordAddress = body.landlordAddress;
        if (body.tenantName !== undefined) updateData.tenantName = body.tenantName;
        if (body.tenantIdPassport !== undefined) updateData.tenantIdPassport = body.tenantIdPassport;
        if (body.tenantLabourCard !== undefined) updateData.tenantLabourCard = body.tenantLabourCard;
        if (body.tenantPhone !== undefined) updateData.tenantPhone = body.tenantPhone;
        if (body.tenantEmail !== undefined) updateData.tenantEmail = body.tenantEmail;
        if (body.tenantSponsor !== undefined) updateData.tenantSponsor = body.tenantSponsor;
        if (body.tenantCR !== undefined) updateData.tenantCR = body.tenantCR;
        if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom);
        if (body.validTo !== undefined) updateData.validTo = new Date(body.validTo);
        if (body.agreementPeriod !== undefined) updateData.agreementPeriod = body.agreementPeriod;
        if (body.monthlyRent !== undefined) updateData.monthlyRent = body.monthlyRent;
        if (body.paymentFrequency !== undefined) updateData.paymentFrequency = body.paymentFrequency.toUpperCase();
        if (body.landlordSignature !== undefined) updateData.landlordSignature = body.landlordSignature;
        if (body.landlordSignDate !== undefined) updateData.landlordSignDate = new Date(body.landlordSignDate);
        if (body.tenantSignature !== undefined) updateData.tenantSignature = body.tenantSignature;
        if (body.tenantSignDate !== undefined) updateData.tenantSignDate = new Date(body.tenantSignDate);
        if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl;

        const contract = await prisma.rentalContract.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(contract);
    } catch (error) {
        console.error("Error updating contract:", error);
        return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
    }
}

// DELETE /api/rental-contracts/[id] - Delete a contract
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        // Check if contract exists
        const existingContract = await prisma.rentalContract.findUnique({
            where: { id },
        });

        if (!existingContract) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        await prisma.rentalContract.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Contract deleted successfully" });
    } catch (error) {
        console.error("Error deleting contract:", error);
        return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 });
    }
}
