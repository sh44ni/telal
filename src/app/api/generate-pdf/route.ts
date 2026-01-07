import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import type { RentalContract } from "@/types";

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

// Generate HTML from template with contract data
function generateHTML(contract: RentalContract, logoDataUrl: string): string {
    const paymentFreqLabel = contract.paymentFrequency === "monthly" ? "Monthly / شهري" :
        contract.paymentFrequency === "quarterly" ? "Quarterly / ربع سنوي" :
            contract.paymentFrequency === "yearly" ? "Yearly / سنوي" : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenancy Agreement - ${contract.contractNumber}</title>
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
            font-size: 9pt;
        }
        body {
            background-color: white;
            color: #333;
            line-height: 1.3;
        }
        .a4-page {
            width: 210mm;
            height: 297mm;
            background: white;
            position: relative;
            padding: 15mm;
            page-break-after: always;
        }
        .letterhead {
            padding: 3mm 0 4mm;
            border-bottom: 0.5pt solid #e0e0e0;
            margin-bottom: 3mm;
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
            font-size: 8pt;
            line-height: 1.4;
        }
        .section-header {
            background: #6c757d;
            color: white;
            padding: 1mm 3mm;
            margin: 2mm 0 1.5mm;
            font-weight: bold;
            font-size: 8pt;
            display: flex;
            justify-content: space-between;
        }
        .field-row {
            display: flex;
            border: 0.4pt solid #ddd;
            margin-bottom: 1mm;
            min-height: 6mm;
        }
        .label-eng {
            width: 22%;
            padding: 1.5mm 2mm;
            background: #f8f9fa;
            border-right: 0.4pt solid #ddd;
            font-weight: 500;
            display: flex;
            align-items: center;
            font-size: 8pt;
        }
        .input-area {
            width: 56%;
            padding: 1mm 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
        }
        .label-arabic {
            width: 22%;
            padding: 1.5mm 2mm;
            background: #f8f9fa;
            border-left: 0.4pt solid #ddd;
            font-weight: 500;
            text-align: right;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            font-size: 10pt;
            direction: rtl;
        }
        .details-row {
            display: flex;
            margin-bottom: 1.5mm;
            min-height: 5mm;
        }
        .details-label-eng {
            width: 25%;
            padding: 1.5mm 2mm;
            font-weight: 500;
            display: flex;
            align-items: center;
            font-size: 7.5pt;
        }
        .details-input {
            width: 50%;
            padding: 1.5mm 2mm;
            border-bottom: 0.4pt solid #333;
            font-size: 8pt;
            display: flex;
            align-items: center;
        }
        .details-label-arabic {
            width: 25%;
            padding: 1.5mm 2mm;
            font-weight: 500;
            text-align: right;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            font-size: 10pt;
            direction: rtl;
        }
        .from-expiring-row {
            display: flex;
            margin-bottom: 1.5mm;
        }
        .from-expiring-label {
            width: 12.5%;
            padding: 1.5mm 2mm;
            font-weight: 500;
            display: flex;
            align-items: center;
        }
        .from-expiring-input {
            width: 25%;
            padding: 1.5mm 2mm;
            border-bottom: 0.4pt solid #333;
            font-size: 8pt;
        }
        .from-expiring-label-arabic {
            width: 12.5%;
            padding: 1.5mm 2mm;
            font-weight: 500;
            text-align: right;
            direction: rtl;
            font-size: 10pt;
        }
        .horizontal-line {
            border-top: 1.5pt solid #000;
            margin: 3mm 0;
        }
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 5mm;
            gap: 10mm;
        }
        .signature-block {
            width: 45%;
        }
        .signature-item {
            margin-bottom: 6mm;
        }
        .sig-label-ar {
            font-size: 9pt;
            font-weight: 700;
            direction: rtl;
        }
        .sig-label-en {
            font-size: 9pt;
            font-weight: 700;
        }
        .sig-line {
            border-bottom: 1.5pt solid #000;
            min-height: 8mm;
            margin-top: 2mm;
            font-size: 9pt;
            padding-top: 2mm;
        }
        .footer {
            padding: 3mm 0 2mm;
            border-top: 0.4pt solid #e0e0e0;
            text-align: center;
            font-size: 7.5pt;
            color: #555;
            position: absolute;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
            line-height: 1.3;
        }
        .footer-ar {
            direction: rtl;
        }
        /* Page 2 */
        .terms-columns {
            display: flex;
            gap: 10mm;
            margin-top: 3mm;
        }
        .terms-col-en {
            flex: 1;
            font-size: 8pt;
            line-height: 1.5;
        }
        .terms-col-ar {
            flex: 1;
            font-size: 10pt;
            line-height: 1.6;
            text-align: right;
            direction: rtl;
        }
        .term-paragraph {
            margin-bottom: 4mm;
            text-align: justify;
        }
    </style>
</head>
<body>
    <!-- PAGE 1 -->
    <div class="a4-page">
        <div class="letterhead">
            <div class="letterhead-row">
                <div class="letterhead-left"></div>
                <div class="letterhead-center">
                    <img src="${logoDataUrl}" alt="Telal Al-Bidaya" />
                </div>
                <div class="letterhead-right">
                    <div style="font-weight: 600;">Agreement No: ${contract.contractNumber}</div>
                    <div>Date: ${formatDate(contract.createdAt)}</div>
                </div>
            </div>
        </div>

        <div class="section-header">
            <span>Tenancy Agreement</span>
            <span>عقد الإيجار</span>
        </div>

        <div class="section-header">
            <span>Landlord Details (First Party)</span>
            <span>تفاصيل المالك (الطرف الأول)</span>
        </div>

        <div class="field-row">
            <div class="label-eng">Name</div>
            <div class="input-area">${contract.landlordName}</div>
            <div class="label-arabic">الاسم</div>
        </div>
        <div class="field-row">
            <div class="label-eng">CR No</div>
            <div class="input-area">${contract.landlordCR}</div>
            <div class="label-arabic">رقم السجل التجاري</div>
        </div>
        <div class="field-row">
            <div class="label-eng">P.O. Box</div>
            <div class="input-area">${contract.landlordPOBox}</div>
            <div class="label-arabic">صندوق البريد</div>
        </div>
        <div class="field-row">
            <div class="label-eng">Postal Code</div>
            <div class="input-area">${contract.landlordPostalCode}</div>
            <div class="label-arabic">الرمز البريدي</div>
        </div>
        <div class="field-row">
            <div class="label-eng">Address</div>
            <div class="input-area">${contract.landlordAddress}</div>
            <div class="label-arabic">العنوان</div>
        </div>

        <div class="section-header">
            <span>Tenant Details (Second Party)</span>
            <span>تفاصيل المستأجر (الطرف الثاني)</span>
        </div>

        <div class="field-row">
            <div class="label-eng">Name</div>
            <div class="input-area">${contract.tenantName}</div>
            <div class="label-arabic">الاسم</div>
        </div>
        <div class="field-row">
            <div class="label-eng">Id/Passport (For Omani)</div>
            <div class="input-area">${contract.tenantIdPassport}</div>
            <div class="label-arabic">رقم الهوية/جواز السفر</div>
        </div>
        <div class="field-row">
            <div class="label-eng">Labour Card (For Expats)</div>
            <div class="input-area">${contract.tenantLabourCard || "N/A"}</div>
            <div class="label-arabic">بطاقة العمل</div>
        </div>
        <div class="field-row">
            <div class="label-eng">Sponsor Name</div>
            <div class="input-area">${contract.tenantSponsor || "N/A"}</div>
            <div class="label-arabic">اسم الكفيل</div>
        </div>
        <div class="field-row">
            <div class="label-eng">CR (For Companies)</div>
            <div class="input-area">${contract.tenantCR || "N/A"}</div>
            <div class="label-arabic">السجل التجاري</div>
        </div>
        <div class="field-row">
            <div class="label-eng">Phone Number</div>
            <div class="input-area">${contract.tenantPhone}</div>
            <div class="label-arabic">رقم الهاتف</div>
        </div>
        <div class="field-row">
            <div class="label-eng">Email</div>
            <div class="input-area">${contract.tenantEmail}</div>
            <div class="label-arabic">البريد الإلكتروني</div>
        </div>

        <div style="margin-top: 2mm;">
            <div class="details-row">
                <div class="details-label-eng">This Agreement is valid for a period of</div>
                <div class="details-input">${contract.agreementPeriod || ""}</div>
                <div class="details-label-arabic">يسري هذا العقد لمدة</div>
            </div>

            <div class="from-expiring-row">
                <div class="from-expiring-label">From</div>
                <div class="from-expiring-input">${formatDate(contract.validFrom)}</div>
                <div class="from-expiring-label">Expiring</div>
                <div class="from-expiring-input">${formatDate(contract.validTo)}</div>
                <div class="from-expiring-label-arabic">يبدأ في / ينتهي في</div>
            </div>

            <div class="details-row">
                <div class="details-label-eng">Monthly Rental Fee</div>
                <div class="details-input">OMR ${contract.monthlyRent?.toFixed(3) || "0.000"}</div>
                <div class="details-label-arabic">الرسوم الإيجارية الشهرية</div>
            </div>
            <div class="details-row">
                <div class="details-label-eng">To be paid in advance every</div>
                <div class="details-input">${paymentFreqLabel}</div>
                <div class="details-label-arabic">يدفع مقدما كل</div>
            </div>
        </div>

        <div class="horizontal-line"></div>

        <div class="signature-section">
            <div class="signature-block">
                <div class="signature-item">
                    <div class="sig-label-ar">توقيع المستأجر:</div>
                    <div class="sig-label-en">Tenant Signature:</div>
                    <div class="sig-line">${contract.tenantSignature || ""}</div>
                </div>
                <div class="signature-item">
                    <div class="sig-label-ar">التاريخ:</div>
                    <div class="sig-label-en">Date:</div>
                    <div class="sig-line">${formatDate(contract.tenantSignDate)}</div>
                </div>
            </div>
            <div class="signature-block">
                <div class="signature-item">
                    <div class="sig-label-ar">توقيع المالك:</div>
                    <div class="sig-label-en">Landlord Signature:</div>
                    <div class="sig-line">${contract.landlordSignature || ""}</div>
                </div>
                <div class="signature-item">
                    <div class="sig-label-ar">التاريخ:</div>
                    <div class="sig-label-en">Date:</div>
                    <div class="sig-line">${formatDate(contract.landlordSignDate)}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-ar">91997970 / 99171889 : تلفاكس - 316 : الرمز البريدي - 500 : ص.ب - 1603540 : ت.س</div>
            <div>CR:1603540, P.O. Box: 500, PCode: 316, GSM: 99171889 / 91997970, Sultanate of Oman</div>
        </div>
    </div>

    <!-- PAGE 2: Terms and Conditions -->
    <div class="a4-page">
        <div class="letterhead">
            <div class="letterhead-row">
                <div class="letterhead-left"></div>
                <div class="letterhead-center">
                    <img src="${logoDataUrl}" alt="Telal Al-Bidaya" />
                </div>
                <div class="letterhead-right">
                    <div style="font-weight: 600;">Agreement No: ${contract.contractNumber}</div>
                    <div>Date: ${formatDate(contract.createdAt)}</div>
                </div>
            </div>
        </div>

        <div class="section-header">
            <span>Terms and Conditions</span>
            <span>بنود العقد</span>
        </div>

        <div class="terms-columns">
            <div class="terms-col-en">
                <p class="term-paragraph">
                    1. The second party is obliged to clean the property and to carry out the necessary periodic maintenance for it, including air conditioners and heaters, and it is obliged to return the property in the condition it received.
                </p>
                <p class="term-paragraph">
                    2. The second party is obligated to pay the rent in advance at the beginning of each month, and the first party has the right to cancel the tenant's contract in case of non-compliance with the conditions.
                </p>
                <p class="term-paragraph">
                    3. This contract is automatically renewed for it's duration or other similar periods unless one of the parties has notified in writing to the other party of its desire to vacate the property three months before the end of the current period.
                </p>
                <p class="term-paragraph">
                    4. The tenant does not have the right to cancel this contract before the expiry of the specified period and in the event he wants to cancel the contract before its expiry for convincing reasons accepted by the lessor, the tenant is obliged to provide an alternative to him or pay the rent amount until three months.
                </p>
                <p class="term-paragraph">
                    5. The tenant is not responsible and has no right to transfer this contract to any other party, and it is not permissible for him to lease the property from the subcontractor unless he has obtained written approval from the first party.
                </p>
            </div>
            <div class="terms-col-ar">
                <p class="term-paragraph">
                    ١. يلتزم الطرف الثاني بنظافة العقار وإجراء الصيانة الدورية اللازمة له بما فيها المكيفات والسخانات ويلتزم بإرجاع العقار بالحالة التي استلمها.
                </p>
                <p class="term-paragraph">
                    ٢. يلتزم الطرف الثاني بدفع الإيجار مقدم بداية كل شهر ويحق للطرف الأول إلغاء عقد المستأجر في حالة عدم الالتزام بالشروط.
                </p>
                <p class="term-paragraph">
                    ٣. يتجدد هذا العقد تلقائياً إلى مدد أخرى مماثلة له ما لم يعلن أحد الطرفين كتابياً للطرف الآخر عن رغبته في إخلاء العقار قبل انتهاء المدة الجارية بثلاثة أشهر.
                </p>
                <p class="term-paragraph">
                    ٤. لا يحق للمستأجر فسخ هذا العقد إلا بعد انقضاء المدة المحددة وفي حال رغب إلغاء العقد قبل موعد انتهاء لأسباب مقنعة يرتضيها المؤجر يلتزم المستأجر بتوفير بديل أو دفع مبلغ الإيجار لثلاثة أشهر.
                </p>
                <p class="term-paragraph">
                    ٥. لا يحق للمؤجر نقل العقد إلى أي جهة أخرى كما لا يجوز له تأجير العقار من الباطن ما لم يحصل على موافقة كتابية من الطرف الأول.
                </p>
            </div>
        </div>

        <div class="footer">
            <div class="footer-ar">91997970 / 99171889 : تلفاكس - 316 : الرمز البريدي - 500 : ص.ب - 1603540 : ت.س</div>
            <div>CR:1603540, P.O. Box: 500, PCode: 316, GSM: 99171889 / 91997970, Sultanate of Oman</div>
        </div>
    </div>
</body>
</html>`;
}

// Find Chrome executable path
function getChromePath(): string {
    const paths = [
        // Windows
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
        // Edge (as fallback)
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
        const contract: RentalContract = body.contract;

        if (!contract) {
            return NextResponse.json(
                { error: "Contract data is required" },
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
        const html = generateHTML(contract, logoDataUrl);

        // Set content with base URL for images
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

        // Return PDF as response - convert Uint8Array to Buffer
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="contract-${contract.contractNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error("PDF generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
