import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
    try {
        ensureUploadsDir();

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Get file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name;
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
        const fileName = `${safeBaseName}_${timestamp}${ext}`;

        // Save file
        const filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        // Return file info
        return NextResponse.json({
            success: true,
            fileName,
            originalName,
            fileUrl: `/uploads/${fileName}`,
            fileType: file.type,
            fileSize: file.size,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}

// DELETE /api/upload - Delete a file
export async function DELETE(request: NextRequest) {
    try {
        const { fileName } = await request.json();

        if (!fileName) {
            return NextResponse.json({ error: "No fileName provided" }, { status: 400 });
        }

        const filePath = path.join(UPLOADS_DIR, fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
