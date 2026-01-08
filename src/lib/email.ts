import { Resend } from "resend";

// Email configuration
const EMAIL_CONFIG = {
    from: "Telal Al-Bidaya <no-reply@telalalbidaya.cloud>",
    replyTo: "info@telalalbidaya.cloud",
};

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    try {
        // Initialize Resend at runtime (not build time)
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error("RESEND_API_KEY is not configured");
            return { success: false, error: "Email service not configured" };
        }

        const resend = new Resend(apiKey);

        const { data, error } = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [to],
            subject,
            html,
        });

        if (error) {
            console.error("Email send error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (error) {
        console.error("Email service error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send email"
        };
    }
}

// Late Payment Reminder Email Template
export function generateLatePaymentEmail(params: {
    tenantName: string;
    propertyName: string;
    amountDue: number;
    daysOverdue: number;
    dueDate: string;
}): string {
    const { tenantName, propertyName, amountDue, daysOverdue, dueDate } = params;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background-color: #605c53; padding: 30px; text-align: center;">
                <h1 style="color: #cea26e; margin: 0; font-size: 24px;">Telal Al-Bidaya</h1>
                <p style="color: #ffffff; margin: 5px 0 0; font-size: 14px;">Real Estate Management</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #605c53; margin: 0 0 20px; font-size: 20px;">Payment Reminder</h2>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dear <strong>${tenantName}</strong>,
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    This is a friendly reminder that your rent payment for <strong>${propertyName}</strong> is overdue.
                </p>
                
                <!-- Payment Details Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border: 1px solid #eee; margin: 20px 0;">
                    <tr>
                        <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                                        <span style="color: #666;">Amount Due:</span>
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
                                        <strong style="color: #e74c3c; font-size: 18px;">OMR ${amountDue.toFixed(3)}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                                        <span style="color: #666;">Due Date:</span>
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
                                        <strong style="color: #333;">${dueDate}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <span style="color: #666;">Days Overdue:</span>
                                    </td>
                                    <td style="padding: 10px 0; text-align: right;">
                                        <strong style="color: #e74c3c;">${daysOverdue} days</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    Please make the payment at your earliest convenience to avoid any late fees or penalties.
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    If you have already made the payment, please disregard this email.
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    For any questions, please contact us.
                </p>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">
                    Best regards,<br>
                    <strong>Telal Al-Bidaya Real Estate</strong>
                </p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #605c53; padding: 20px 30px; text-align: center;">
                <p style="color: #ffffff; font-size: 12px; margin: 0;">
                    Telal Al-Bidaya Real Estate<br>
                    P.O. Box: 500 | Postal Code: 316 | Sultanate of Oman<br>
                    Tel: 99171889 / 91997970
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}
