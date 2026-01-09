import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import fs from "fs";
import path from "path";

// Force Node.js runtime (required for fs and path modules)
export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Helper to calculate directory size recursively
function getDirectorySize(dirPath: string): number {
    if (!fs.existsSync(dirPath)) return 0;

    let size = 0;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            size += getDirectorySize(filePath);
        } else {
            size += stats.size;
        }
    }

    return size;
}

// GET /api/storage - Get storage information
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const TOTAL_STORAGE = 50 * 1024 * 1024 * 1024; // 50GB in bytes
        const SYSTEM_SIZE = 12 * 1024 * 1024 * 1024; // 12GB in bytes

        // Calculate actual user data size
        const uploadsSize = getDirectorySize(UPLOADS_DIR);
        const dataSize = uploadsSize;

        return NextResponse.json({
            total: TOTAL_STORAGE,
            system: SYSTEM_SIZE,
            data: dataSize,
            available: TOTAL_STORAGE - SYSTEM_SIZE - dataSize,
            // Formatted versions for display
            formatted: {
                total: "50 GB",
                system: "12 GB",
                data: formatBytes(dataSize),
                available: formatBytes(TOTAL_STORAGE - SYSTEM_SIZE - dataSize),
            }
        });
    } catch (error) {
        console.error("Error getting storage info:", error);
        return NextResponse.json({ error: "Failed to get storage info" }, { status: 500 });
    }
}

// DELETE /api/storage - Clean all user data
export async function DELETE(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const { confirmPhrase } = await request.json();

        // Verify the confirmation phrase
        if (confirmPhrase !== "DELETE ALL DATA") {
            return NextResponse.json(
                { error: "Invalid confirmation phrase. Type 'DELETE ALL DATA' to confirm." },
                { status: 400 }
            );
        }

        // 1. Clear all user files from uploads
        if (fs.existsSync(UPLOADS_DIR)) {
            const files = fs.readdirSync(UPLOADS_DIR);
            for (const file of files) {
                const filePath = path.join(UPLOADS_DIR, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // 2. Delete all data from database (using Prisma deleteMany)
        // Delete in order to respect foreign key constraints
        await prisma.receipt.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.rental.deleteMany({});
        await prisma.contract.deleteMany({});
        await prisma.rentalContract.deleteMany({});
        await prisma.saleContract.deleteMany({});
        await prisma.document.deleteMany({});
        await prisma.property.deleteMany({});
        await prisma.customer.deleteMany({});
        await prisma.project.deleteMany({});

        return NextResponse.json({
            success: true,
            message: "All user data has been deleted successfully.",
        });
    } catch (error) {
        console.error("Error cleaning storage:", error);
        return NextResponse.json({ error: "Failed to clean storage" }, { status: 500 });
    }
}

// Helper to format bytes to human-readable format
function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + units[i];
}
