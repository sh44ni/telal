import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/customers/[id] - Get a single customer
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const customer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
    }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Check if customer exists
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Convert type to uppercase if provided
        const updateData: any = { ...body };
        if (body.type) {
            updateData.type = body.type.toUpperCase();
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

// DELETE /api/customers/[id] - Delete a customer with cascade
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if customer exists and get name for response
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                rentals: {
                    select: { id: true, propertyId: true }
                },
                transactions: {
                    select: { id: true }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const deletedRentals = customer.rentals.length;
        const deletedTransactions = customer.transactions.length;
        const customerName = customer.name;

        // Get property IDs to update status
        const propertyIds = customer.rentals.map(r => r.propertyId);

        // Delete customer (cascade will handle related records via Prisma schema)
        await prisma.customer.delete({
            where: { id },
        });

        // Update properties that were rented to this customer to "available"
        if (propertyIds.length > 0) {
            await prisma.property.updateMany({
                where: {
                    id: { in: propertyIds },
                    status: 'RENTED',
                },
                data: {
                    status: 'AVAILABLE',
                },
            });
        }

        return NextResponse.json({
            message: "Customer deleted successfully",
            deletedTransactions,
            deletedRentals,
            freedProperties: propertyIds.length,
            customerName
        });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}
