import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import type { Document } from "@/types";

// GET /api/documents - Get all documents
export async function GET() {
    try {
        const data = readData();
        return NextResponse.json(data.documents);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

// POST /api/documents - Create a new document entry
export async function POST(request: NextRequest) {
    try {
        const document: Document = await request.json();
        const data = readData();

        // Ensure ID exists
        if (!document.id) {
            document.id = `doc-${Date.now()}`;
        }

        // Set timestamps
        const now = new Date().toISOString();
        document.createdAt = document.createdAt || now;
        document.uploadDate = document.uploadDate || now.split("T")[0];

        data.documents.push(document);
        writeData(data);

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
    }
}
