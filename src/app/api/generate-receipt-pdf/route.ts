import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import type { Receipt } from "@/types";

// Get logo as base64 data URL
function getLogoDataUrl(): string {
    try {
        const logoPath = path.join(process.cwd(), "public", "logo-full.png");
        const logoBuffer = fs.readFileSync(logoPath);
        const base64 = logoBuffer.toString("base64");
        return `data:image/png;base64,${base64}`;
    } catch (error) {
        console.error("Failed to load logo:", error);
        return "";
    }
}

// Helper to format date
const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return dateString;
    }
};

// Format currency
const formatCurrency = (amount: number): string => {
    return `OMR ${amount.toFixed(3)}`;
};

// Get payment method label
const getPaymentMethodLabel = (method: string): { en: string; ar: string } => {
    const labels: Record<string, { en: string; ar: string }> = {
        cash: { en: "Cash", ar: "نقداً" },
        card: { en: "Card", ar: "بطاقة" },
        bank_transfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
        cheque: { en: "Cheque", ar: "شيك" },
    };
    return labels[method] || { en: method, ar: method };
};

// Get receipt type label
const getReceiptTypeLabel = (type: string): { en: string; ar: string } => {
    const labels: Record<string, { en: string; ar: string }> = {
        rent: { en: "Rent Payment", ar: "دفع الإيجار" },
        deposit: { en: "Deposit", ar: "تأمين" },
        maintenance: { en: "Maintenance", ar: "صيانة" },
        other: { en: "Other", ar: "أخرى" },
    };
    return labels[type] || { en: type, ar: type };
};

// Generate HTML for receipt PDF
function generateHTML(receipt: Receipt, logoDataUrl: string): string {
    const paymentMethod = getPaymentMethodLabel(receipt.paymentMethod);
    const receiptType = getReceiptTypeLabel(receipt.type);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receipt.receiptNo}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            background-color: white;
            color: #333;
            line-height: 1.4;
        }
        .receipt-page {
            width: 210mm;
            min-height: 148mm;
            background: white;
            position: relative;
            padding: 15mm;
        }
        .letterhead {
            padding: 3mm 0 4mm;
            border-bottom: 2px solid #cea26e;
            margin-bottom: 8mm;
        }
        .letterhead-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .letterhead-left { width: 30%; }
        .letterhead-center { 
            width: 40%; 
            text-align: center;
        }
        .letterhead-center img {
            max-width: 150px;
            height: auto;
        }
        .letterhead-right { 
            width: 30%; 
            text-align: right;
            font-size: 10pt;
        }
        .receipt-title {
            text-align: center;
            margin-bottom: 8mm;
        }
        .receipt-title h1 {
            font-size: 24pt;
            color: #605c53;
            margin-bottom: 2mm;
        }
        .receipt-title .receipt-no {
            font-size: 14pt;
            color: #cea26e;
            font-weight: bold;
        }
        .receipt-content {
            border: 1px solid #ddd;
            padding: 6mm;
        }
        .info-row {
            display: flex;
            border-bottom: 1px solid #eee;
            padding: 3mm 0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            width: 30%;
            font-weight: 600;
            color: #605c53;
        }
        .info-value {
            width: 40%;
            text-align: center;
        }
        .info-label-ar {
            width: 30%;
            text-align: right;
            font-weight: 600;
            color: #605c53;
            direction: rtl;
        }
        .amount-section {
            background: #f8f9fa;
            padding: 6mm;
            margin: 6mm 0;
            text-align: center;
            border: 2px solid #cea26e;
        }
        .amount-label {
            font-size: 12pt;
            color: #605c53;
            margin-bottom: 2mm;
        }
        .amount-value {
            font-size: 24pt;
            font-weight: bold;
            color: #cea26e;
        }
        .footer-section {
            margin-top: 10mm;
            padding-top: 5mm;
            border-top: 1px solid #ddd;
        }
        .signature-row {
            display: flex;
            justify-content: space-between;
            margin-top: 15mm;
        }
        .signature-block {
            width: 45%;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            height: 10mm;
            margin-bottom: 2mm;
        }
        .signature-label {
            font-size: 9pt;
            color: #666;
            text-align: center;
        }
        .company-footer {
            text-align: center;
            margin-top: 10mm;
            padding-top: 5mm;
            border-top: 1px solid #eee;
            font-size: 8pt;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="receipt-page">
        <div class="letterhead">
            <div class="letterhead-row">
                <div class="letterhead-left"></div>
                <div class="letterhead-center">
                    <img src="${logoDataUrl}" alt="Telal Al-Bidaya" />
                </div>
                <div class="letterhead-right">
                    <div>Date: ${formatDate(receipt.date)}</div>
                    <div>التاريخ</div>
                </div>
            </div>
        </div>

        <div class="receipt-title">
            <h1>RECEIPT / إيصال</h1>
            <div class="receipt-no">${receipt.receiptNo}</div>
        </div>

        <div class="amount-section">
            <div class="amount-label">Amount Received / المبلغ المستلم</div>
            <div class="amount-value">${formatCurrency(receipt.amount)}</div>
        </div>

        <div class="receipt-content">
            <div class="info-row">
                <div class="info-label">Received From</div>
                <div class="info-value">${receipt.paidBy}</div>
                <div class="info-label-ar">استلمنا من</div>
            </div>
            <div class="info-row">
                <div class="info-label">Receipt Type</div>
                <div class="info-value">${receiptType.en} / ${receiptType.ar}</div>
                <div class="info-label-ar">نوع الإيصال</div>
            </div>
            <div class="info-row">
                <div class="info-label">Payment Method</div>
                <div class="info-value">${paymentMethod.en} / ${paymentMethod.ar}</div>
                <div class="info-label-ar">طريقة الدفع</div>
            </div>
            ${receipt.reference ? `
            <div class="info-row">
                <div class="info-label">Reference</div>
                <div class="info-value">${receipt.reference}</div>
                <div class="info-label-ar">المرجع</div>
            </div>
            ` : ''}
            ${receipt.description ? `
            <div class="info-row">
                <div class="info-label">Description</div>
                <div class="info-value">${receipt.description}</div>
                <div class="info-label-ar">الوصف</div>
            </div>
            ` : ''}
        </div>

        <div class="footer-section">
            <div class="signature-row">
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-label">Received By / المستلم</div>
                </div>
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-label">Authorized Signature / التوقيع المعتمد</div>
                </div>
            </div>
        </div>

        <div class="company-footer">
            <div>Telal Al-Bidaya Real Estate</div>
            <div>CR: 1603540 | P.O. Box: 500 | Postal Code: 316 | Sultanate of Oman</div>
            <div>Tel: 99171889 / 91997970</div>
        </div>
    </div>
</body>
</html>`;
}

// Find Chrome executable path
function getChromePath(): string {
    const paths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ];

    for (const p of paths) {
        try {
            require("fs").accessSync(p);
            return p;
        } catch {
            continue;
        }
    }

    throw new Error("Chrome not found. Please install Chrome or Edge.");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const receipt: Receipt = body.receipt;

        if (!receipt) {
            return NextResponse.json(
                { error: "Receipt data is required" },
                { status: 400 }
            );
        }

        // Get Chrome path
        const chromePath = getChromePath();

        // Launch browser
        const browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();

        // Get logo data URL
        const logoDataUrl = getLogoDataUrl();

        // Generate HTML content
        const html = generateHTML(receipt, logoDataUrl);

        // Set content
        await page.setContent(html, {
            waitUntil: "networkidle0",
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        await browser.close();

        // Return PDF
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="receipt-${receipt.receiptNo}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Receipt PDF generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
