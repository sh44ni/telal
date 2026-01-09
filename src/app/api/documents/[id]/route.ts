import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/documents/[id] - Get a single document
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                property: true,
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        console.error("Error fetching document:", error);
        return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
    }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check if document exists
        const existingDocument = await prisma.document.findUnique({
            where: { id },
        });

        if (!existingDocument) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.category !== undefined) updateData.category = body.category.toUpperCase();
        if (body.fileType !== undefined) updateData.fileType = body.fileType;
        if (body.fileSize !== undefined) updateData.fileSize = body.fileSize;
        if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
        if (body.relatedType !== undefined) updateData.relatedType = body.relatedType;
        if (body.relatedId !== undefined) updateData.relatedId = body.relatedId;
        if (body.propertyId !== undefined) updateData.propertyId = body.propertyId;
        if (body.uploadDate !== undefined) updateData.uploadDate = new Date(body.uploadDate);

        const document = await prisma.document.update({
            where: { id },
            data: updateData,
            include: {
                property: true,
            },
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("Error updating document:", error);
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
    }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        // Check if document exists
        const existingDocument = await prisma.document.findUnique({
            where: { id },
        });

        if (!existingDocument) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        await prisma.document.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
