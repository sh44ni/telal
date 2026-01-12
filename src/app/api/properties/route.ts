import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Generate property ID in PRP-XXXX format
async function generatePropertyId(): Promise<string> {
    const properties = await prisma.property.findMany({
        orderBy: { propertyId: 'desc' },
        take: 1,
    });

    if (!properties || properties.length === 0) {
        return "PRP-0001";
    }

    const lastPropertyId = properties[0].propertyId;
    const match = lastPropertyId?.match(/PRP-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;

    return `PRP-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/properties - Get all properties
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const properties = await prisma.property.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(properties, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error("Error fetching properties:", error);
        return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
    }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!body.name?.trim()) {
            errors.push("Property name is required");
        }
        if (!body.type) {
            errors.push("Property type is required");
        }
        if (!body.location?.trim()) {
            errors.push("Location is required");
        }
        if (!body.price || body.price <= 0) {
            errors.push("Price must be greater than 0");
        }
        if (!body.area || body.area <= 0) {
            errors.push("Area must be greater than 0");
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        // Generate property ID if not present
        const propertyId = body.propertyId || await generatePropertyId();

        // Convert type and status to uppercase enum values
        const propertyType = body.type.toUpperCase();
        const propertyStatus = body.status ? body.status.toUpperCase() : 'AVAILABLE';

        const property = await prisma.property.create({
            data: {
                propertyId,
                name: body.name.trim(),
                type: propertyType,
                status: propertyStatus,
                price: body.price,
                rentalPrice: body.rentalPrice || null,
                area: body.area,
                bedrooms: body.bedrooms || null,
                bathrooms: body.bathrooms || null,
                location: body.location.trim(),
                address: body.address || '',
                description: body.description || '',
                features: body.features || [],
                images: body.images || [],
                saleInfo: body.saleInfo || null,
                projectId: body.projectId || null,
                ownerId: body.ownerId || null,
            },
        });

        return NextResponse.json(property, { status: 201 });
    } catch (error) {
        console.error("Error creating property:", error);
        return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
    }
}
