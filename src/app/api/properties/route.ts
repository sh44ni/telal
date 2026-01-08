import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import type { Property } from "@/types";

// GET /api/properties - Get all properties
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const data = readData();
        return NextResponse.json(data.properties);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
    }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const property: Property = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!property.name?.trim()) {
            errors.push("Property name is required");
        }
        if (!property.type) {
            errors.push("Property type is required");
        }
        if (!property.location?.trim()) {
            errors.push("Location is required");
        }
        if (!property.price || property.price <= 0) {
            errors.push("Price must be greater than 0");
        }
        if (!property.area || property.area <= 0) {
            errors.push("Area must be greater than 0");
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        const data = readData();

        // Ensure ID exists
        if (!property.id) {
            property.id = `prop-${Date.now()}`;
        }

        // Set timestamps
        const now = new Date().toISOString();
        property.createdAt = property.createdAt || now;
        property.updatedAt = now;

        // Set defaults
        property.images = property.images || [];
        property.features = property.features || [];

        data.properties.push(property);
        writeData(data);

        return NextResponse.json(property, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
    }
}
