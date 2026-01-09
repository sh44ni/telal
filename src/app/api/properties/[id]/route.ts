import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/properties/[id] - Get a single property
export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const property = await prisma.property.findUnique({
            where: { id },
        });

        if (!property) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        return NextResponse.json(property);
    } catch (error) {
        console.error("Error fetching property:", error);
        return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
    }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if property exists
        const existingProperty = await prisma.property.findUnique({
            where: { id },
        });

        if (!existingProperty) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.type !== undefined) updateData.type = body.type.toUpperCase();
        if (body.status !== undefined) updateData.status = body.status.toUpperCase();
        if (body.price !== undefined) updateData.price = body.price;
        if (body.rentalPrice !== undefined) updateData.rentalPrice = body.rentalPrice;
        if (body.area !== undefined) updateData.area = body.area;
        if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
        if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
        if (body.location !== undefined) updateData.location = body.location.trim();
        if (body.address !== undefined) updateData.address = body.address;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.features !== undefined) updateData.features = body.features;
        if (body.images !== undefined) updateData.images = body.images;
        if (body.saleInfo !== undefined) updateData.saleInfo = body.saleInfo;
        if (body.projectId !== undefined) updateData.projectId = body.projectId;
        if (body.ownerId !== undefined) updateData.ownerId = body.ownerId;

        const property = await prisma.property.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(property);
    } catch (error) {
        console.error("Error updating property:", error);
        return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
    }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        // Check if property exists
        const existingProperty = await prisma.property.findUnique({
            where: { id },
        });

        if (!existingProperty) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        await prisma.property.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Property deleted successfully" });
    } catch (error) {
        console.error("Error deleting property:", error);
        return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
    }
}
