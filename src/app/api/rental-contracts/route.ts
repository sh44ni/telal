import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Helper to generate contract number
function generateContractNumber(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `RC-${y}${m}${d}-${rand}`;
}

// GET /api/rental-contracts - Get all rental contracts
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const contracts = await prisma.rentalContract.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(contracts);
    } catch (error) {
        console.error("Error fetching contracts:", error);
        return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
    }
}

// POST /api/rental-contracts - Create a new rental contract
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!body.landlordName?.trim()) {
            errors.push("Landlord name is required");
        }
        if (!body.tenantName?.trim()) {
            errors.push("Tenant name is required");
        }
        if (!body.tenantIdPassport?.trim()) {
            errors.push("Tenant ID/Passport is required");
        }
        if (!body.tenantPhone?.trim()) {
            errors.push("Tenant phone is required");
        }
        if (!body.validFrom) {
            errors.push("Contract start date is required");
        }
        if (!body.validTo) {
            errors.push("Contract end date is required");
        }
        if (!body.monthlyRent || body.monthlyRent <= 0) {
            errors.push("Monthly rent must be greater than 0");
        }

        // Validate dates
        if (body.validFrom && body.validTo) {
            const startDate = new Date(body.validFrom);
            const endDate = new Date(body.validTo);
            if (endDate <= startDate) {
                errors.push("Contract end date must be after start date");
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        // Generate contract number if not present
        const contractNumber = body.contractNumber || generateContractNumber();

        // Convert status and payment frequency to uppercase enum values
        const status = body.status ? body.status.toUpperCase() : 'DRAFT';
        const paymentFrequency = body.paymentFrequency ? body.paymentFrequency.toUpperCase() : 'MONTHLY';

        const contract = await prisma.rentalContract.create({
            data: {
                contractNumber,
                type: 'RENTAL',
                status,
                // Landlord
                landlordName: body.landlordName.trim(),
                landlordCR: body.landlordCR || '',
                landlordPOBox: body.landlordPOBox || '',
                landlordPostalCode: body.landlordPostalCode || '',
                landlordAddress: body.landlordAddress || '',
                // Tenant
                tenantName: body.tenantName.trim(),
                tenantIdPassport: body.tenantIdPassport.trim(),
                tenantLabourCard: body.tenantLabourCard || null,
                tenantPhone: body.tenantPhone.trim(),
                tenantEmail: body.tenantEmail || '',
                tenantSponsor: body.tenantSponsor || null,
                tenantCR: body.tenantCR || null,
                // Contract Terms
                validFrom: new Date(body.validFrom),
                validTo: new Date(body.validTo),
                agreementPeriod: body.agreementPeriod || '',
                monthlyRent: body.monthlyRent,
                paymentFrequency,
                // Signatures
                landlordSignature: body.landlordSignature || '',
                landlordSignDate: body.landlordSignDate ? new Date(body.landlordSignDate) : new Date(),
                tenantSignature: body.tenantSignature || '',
                tenantSignDate: body.tenantSignDate ? new Date(body.tenantSignDate) : new Date(),
                // Meta
                pdfUrl: body.pdfUrl || null,
            },
        });

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        console.error("Error creating contract:", error);
        return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
    }
}
