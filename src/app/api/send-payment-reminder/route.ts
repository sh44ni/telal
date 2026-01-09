import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { sendEmail, generateLatePaymentEmail } from "@/lib/email";

// POST /api/send-payment-reminder - Send late payment reminder email
export async function POST(request: NextRequest) {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();
        const { rentalId } = body;

        if (!rentalId) {
            return NextResponse.json({ error: "Rental ID is required" }, { status: 400 });
        }

        // Find the rental with related tenant and property
        const rental = await prisma.rental.findUnique({
            where: { id: rentalId },
            include: {
                tenant: true,
                property: true,
            },
        });

        if (!rental) {
            return NextResponse.json({ error: "Rental not found" }, { status: 404 });
        }

        if (!rental.tenant.email) {
            return NextResponse.json({ error: "Tenant has no email address" }, { status: 400 });
        }

        // Calculate days overdue
        const paidUntilDate = new Date(rental.paidUntil);
        const today = new Date();
        const diffTime = today.getTime() - paidUntilDate.getTime();
        const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        // Format due date
        const dueDate = paidUntilDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        // Generate email HTML
        const emailHtml = generateLatePaymentEmail({
            tenantName: rental.tenant.name,
            propertyName: rental.property.name,
            amountDue: rental.monthlyRent,
            daysOverdue,
            dueDate,
        });

        // Send email
        const result = await sendEmail({
            to: rental.tenant.email,
            subject: `Payment Reminder - ${rental.property.name}`,
            html: emailHtml,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Payment reminder sent to ${rental.tenant.email}`,
                emailId: result.id,
            });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error("Error sending payment reminder:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to send reminder" },
            { status: 500 }
        );
    }
}

// GET /api/send-payment-reminder - Get all overdue rentals
export async function GET() {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const today = new Date();

        // Find overdue rentals
        const overdueRentals = await prisma.rental.findMany({
            where: {
                paidUntil: {
                    lt: today,
                },
            },
            include: {
                tenant: true,
                property: true,
            },
        });

        const formattedRentals = overdueRentals.map(rental => {
            const paidUntilDate = new Date(rental.paidUntil);
            const daysOverdue = Math.floor((today.getTime() - paidUntilDate.getTime()) / (1000 * 60 * 60 * 24));

            return {
                rentalId: rental.id,
                tenantName: rental.tenant.name,
                tenantEmail: rental.tenant.email,
                propertyName: rental.property.name,
                monthlyRent: rental.monthlyRent,
                paidUntil: rental.paidUntil,
                daysOverdue,
            };
        });

        return NextResponse.json(formattedRentals);
    } catch (error) {
        console.error("Error fetching overdue rentals:", error);
        return NextResponse.json({ error: "Failed to fetch overdue rentals" }, { status: 500 });
    }
}
