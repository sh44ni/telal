import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import fs from "fs";
import path from "path";

// Helper function to clean a directory of files
function cleanDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        return 0;
    }

    let deletedCount = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            } catch (err) {
                console.error(`Failed to delete file ${filePath}:`, err);
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dirPath}:`, err);
    }

    return deletedCount;
}

// DELETE - Clean all user data (customers, projects, properties, rentals, contracts, documents)
export async function DELETE() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const cwd = process.cwd();

        // Count items before deleting
        const counts = {
            customers: await prisma.customer.count(),
            projects: await prisma.project.count(),
            properties: await prisma.property.count(),
            rentals: await prisma.rental.count(),
            contracts: await prisma.contract.count(),
            documents: await prisma.document.count(),
            receipts: await prisma.receipt.count(),
            rentalContracts: await prisma.rentalContract.count(),
            saleContracts: await prisma.saleContract.count(),
            transactions: await prisma.transaction.count(),
        };

        // Delete all data from database (using Prisma deleteMany)
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

        // Clean uploaded files
        let filesDeleted = 0;
        filesDeleted += cleanDirectory(path.join(cwd, "public", "uploads"));
        filesDeleted += cleanDirectory(path.join(cwd, "public", "documents"));

        return NextResponse.json({
            success: true,
            message: "All data has been deleted successfully",
            deleted: counts,
            filesDeleted,
        });
    } catch (error) {
        console.error("Error cleaning data:", error);
        return NextResponse.json(
            { error: "Failed to clean data" },
            { status: 500 }
        );
    }
}
