import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/db";
import { sendEmail, generateLatePaymentEmail } from "@/lib/email";

// POST /api/send-payment-reminder - Send late payment reminder email
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { rentalId } = body;

        if (!rentalId) {
            return NextResponse.json({ error: "Rental ID is required" }, { status: 400 });
        }

        const data = readData();

        // Find the rental
        const rental = data.rentals.find(r => r.id === rentalId);
        if (!rental) {
            return NextResponse.json({ error: "Rental not found" }, { status: 404 });
        }

        // Find tenant (customer)
        const tenant = data.customers.find(c => c.id === rental.tenantId);
        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        if (!tenant.email) {
            return NextResponse.json({ error: "Tenant has no email address" }, { status: 400 });
        }

        // Find property
        const property = data.properties.find(p => p.id === rental.propertyId);
        if (!property) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
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
            tenantName: tenant.name,
            propertyName: property.name,
            amountDue: rental.monthlyRent,
            daysOverdue,
            dueDate,
        });

        // Send email
        const result = await sendEmail({
            to: tenant.email,
            subject: `Payment Reminder - ${property.name}`,
            html: emailHtml,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Payment reminder sent to ${tenant.email}`,
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
    try {
        const data = readData();
        const today = new Date();

        // Find overdue rentals
        const overdueRentals = data.rentals
            .filter(rental => {
                const paidUntil = new Date(rental.paidUntil);
                return paidUntil < today;
            })
            .map(rental => {
                const tenant = data.customers.find(c => c.id === rental.tenantId);
                const property = data.properties.find(p => p.id === rental.propertyId);
                const paidUntilDate = new Date(rental.paidUntil);
                const daysOverdue = Math.floor((today.getTime() - paidUntilDate.getTime()) / (1000 * 60 * 60 * 24));

                return {
                    rentalId: rental.id,
                    tenantName: tenant?.name || "Unknown",
                    tenantEmail: tenant?.email || null,
                    propertyName: property?.name || "Unknown",
                    monthlyRent: rental.monthlyRent,
                    paidUntil: rental.paidUntil,
                    daysOverdue,
                };
            });

        return NextResponse.json(overdueRentals);
    } catch (error) {
        console.error("Error fetching overdue rentals:", error);
        return NextResponse.json({ error: "Failed to fetch overdue rentals" }, { status: 500 });
    }
}
