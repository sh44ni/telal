import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/documents - Get all documents
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const documents = await prisma.document.findMany({
            include: {
                property: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

// POST /api/documents - Create a new document entry
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

        // Convert category to uppercase enum value
        const category = body.category ? body.category.toUpperCase() : 'OTHER';

        const document = await prisma.document.create({
            data: {
                name: body.name,
                category,
                fileType: body.fileType,
                fileSize: body.fileSize,
                fileUrl: body.fileUrl,
                relatedType: body.relatedType || null,
                relatedId: body.relatedId || null,
                propertyId: body.propertyId || null,
                uploadDate: body.uploadDate ? new Date(body.uploadDate) : new Date(),
            },
            include: {
                property: true,
            },
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
    }
}
