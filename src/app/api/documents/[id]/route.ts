import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";

// GET /api/documents/[id] - Get a single document
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = readData();
        const document = data.documents.find((d) => d.id === id);

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
    }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updates = await request.json();
        const data = readData();

        const index = data.documents.findIndex((d) => d.id === id);
        if (index === -1) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Update document
        data.documents[index] = {
            ...data.documents[index],
            ...updates,
        };

        writeData(data);

        return NextResponse.json(data.documents[index]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
    }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = readData();

        const index = data.documents.findIndex((d) => d.id === id);
        if (index === -1) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Remove document
        data.documents.splice(index, 1);
        writeData(data);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
