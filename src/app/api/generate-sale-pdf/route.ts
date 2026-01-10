import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import type { SaleContract } from "@/types";

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
function generateHTML(contract: SaleContract, logoDataUrl: string): string {
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عقد بيع منزل سكني - ${contract.contractNumber}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'IBM Plex Sans Arabic', 'Tajawal', sans-serif;
            background-color: white;
            padding: 0;
            direction: rtl;
        }
        
        .page-container {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
            padding: 0;
            overflow: hidden;
        }
        
        .decorative-frame {
            position: absolute;
            top: 8mm;
            left: 8mm;
            right: 8mm;
            bottom: 8mm;
            border: 3px double #8B4513;
            pointer-events: none;
        }
        
        .decorative-frame::before {
            content: '';
            position: absolute;
            top: 3mm;
            left: 3mm;
            right: 3mm;
            bottom: 3mm;
            border: 1px solid #B8860B;
        }
        
        .corner-ornament {
            position: absolute;
            width: 40px;
            height: 40px;
            border-style: solid;
            border-color: #8B4513;
        }
        
        .corner-ornament::before,
        .corner-ornament::after {
            content: '';
            position: absolute;
            background-color: #8B4513;
        }
        
        .top-left-corner {
            top: 8mm;
            left: 8mm;
            border-width: 3px 0 0 3px;
        }
        
        .top-left-corner::before { width: 15px; height: 3px; top: -3px; left: 5px; }
        .top-left-corner::after { width: 3px; height: 15px; left: -3px; top: 5px; }
        
        .top-right-corner {
            top: 8mm;
            right: 8mm;
            border-width: 3px 3px 0 0;
        }
        
        .top-right-corner::before { width: 15px; height: 3px; top: -3px; right: 5px; }
        .top-right-corner::after { width: 3px; height: 15px; right: -3px; top: 5px; }
        
        .bottom-left-corner {
            bottom: 8mm;
            left: 8mm;
            border-width: 0 0 3px 3px;
        }
        
        .bottom-left-corner::before { width: 15px; height: 3px; bottom: -3px; left: 5px; }
        .bottom-left-corner::after { width: 3px; height: 15px; left: -3px; bottom: 5px; }
        
        .bottom-right-corner {
            bottom: 8mm;
            right: 8mm;
            border-width: 0 3px 3px 0;
        }
        
        .bottom-right-corner::before { width: 15px; height: 3px; bottom: -3px; right: 5px; }
        .bottom-right-corner::after { width: 3px; height: 15px; right: -3px; bottom: 5px; }
        
        .content-wrapper {
            position: relative;
            z-index: 1;
            padding: 14mm 18mm 10mm 18mm;
        }
        
        .header {
            text-align: center;
            margin-bottom: 10px;
        }
        
        .logo-placeholder {
            width: 100px;
            height: 100px;
            margin: 0 auto 5px;
            display: ${logoDataUrl ? 'block' : 'none'};
        }
        
        .logo-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .company-name {
            font-size: 10px;
            color: #8B4513;
            font-weight: 600;
            margin-bottom: 4px;
            line-height: 1.5;
            letter-spacing: 0.3px;
        }
        
        .document-number {
            font-size: 11px;
            color: #333;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .document-title {
            font-size: 22px;
            font-weight: 700;
            color: #000;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .document-subtitle {
            font-size: 11px;
            color: #333;
            line-height: 1.5;
            margin-bottom: 12px;
            font-weight: 400;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10px;
        }
        
        .info-table th,
        .info-table td {
            border: 1px solid #555;
            padding: 5px 8px;
            text-align: center;
        }
        
        .info-table th {
            background-color: #d3d3d3;
            font-weight: 700;
            color: #000;
        }
        
        .info-table td {
            background-color: #f9f9f9;
            font-weight: 400;
        }
        
        .terms-section {
            margin-bottom: 10px;
        }
        
        .term-item {
            margin-bottom: 6px;
            line-height: 1.5;
            font-size: 10px;
            text-align: justify;
            font-weight: 400;
        }
        
        .term-number {
            font-weight: 700;
            margin-left: 5px;
        }
        
        .highlight {
            background-color: #ffff00;
            padding: 2px 4px;
            font-weight: 600;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 12px;
            margin-bottom: 10px;
            gap: 20px;
        }
        
        .signature-box {
            text-align: center;
            width: 48%;
        }
        
        .signature-label {
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 25px;
            color: #8B4513;
        }
        
        .signature-line {
            border-top: 1.5px solid #333;
            margin-top: 25px;
            padding-top: 5px;
            font-size: 10px;
        }
        
        .disclaimer {
            font-size: 8px;
            color: #666;
            line-height: 1.5;
            margin-top: 10px;
            margin-bottom: 10px;
            text-align: center;
            padding: 8px 15px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }
        
        .footer {
            text-align: center;
            padding-top: 8px;
            border-top: 2px solid #8B4513;
            margin-top: 10px;
        }
        
        .footer-content {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 25px;
            flex-wrap: wrap;
            font-size: 10px;
            color: #333;
            line-height: 1.4;
        }
        
        .footer-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .footer-icon {
            width: 24px;
            height: 24px;
            background-color: #8B4513;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            flex-shrink: 0;
        }
        
        .footer-item span:not(.footer-icon) {
            text-align: right;
        }
        
        @media print {
            body { padding: 0; background: white; }
            .page-container { box-shadow: none; width: 210mm; height: 297mm; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="decorative-frame"></div>
        
        <div class="corner-ornament top-left-corner"></div>
        <div class="corner-ornament top-right-corner"></div>
        <div class="corner-ornament bottom-left-corner"></div>
        <div class="corner-ornament bottom-right-corner"></div>
        
        <div class="content-wrapper">
            <div class="header">
                ${logoDataUrl ? `<div class="logo-placeholder"><img src="${logoDataUrl}" alt="Company Logo"></div>` : ''}
                
                <div class="document-number">
                    #${contract.contractNumber}<br>
                    الإصدار:الموافق ${formatDate(contract.createdAt)}
                </div>
                
                <h1 class="document-title">عقد بيع منزل سكني</h1>
                
                <p class="document-subtitle">
                    تم تحديد الأجل الإتفاق بين أطراف الموضحة بالتفاصيل فيما يلي:
                </p>
            </div>
            
            <table class="info-table">
                <thead>
                    <tr>
                        <th>رقــــال</th>
                        <th>البائـع (البائـع)</th>
                        <th>التفاصيل</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${contract.buyerCivilId || contract.buyerId || '-'}</td>
                        <td>${contract.sellerCivilId || contract.sellerId || '-'}</td>
                        <td>التعريف</td>
                    </tr>
                    <tr>
                        <td>${contract.buyerName}</td>
                        <td>${contract.sellerName}</td>
                        <td>الأسم</td>
                    </tr>
                    <tr>
                        <td colspan="2">${contract.sellerCR || contract.buyerCR || '-'}</td>
                        <td>الرقم التجاري</td>
                    </tr>
                    <tr>
                        <td colspan="2">${contract.buyerNationality || contract.sellerNationality || '-'}</td>
                        <td>الجنسية</td>
                    </tr>
                    <tr>
                        <td colspan="2">${contract.buyerAddress || contract.sellerAddress || '-'}</td>
                        <td>العنوان</td>
                    </tr>
                    <tr>
                        <td colspan="2">${contract.buyerPhone || contract.sellerPhone || '-'}</td>
                        <td>رقم الهاتف</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="terms-section">
                <div class="term-item">
                    <span class="term-number">-1</span>
                    يقر الطرف الأول البائع بأنه الملاك منزل سكني في ولاية ${contract.propertyWilaya} محافظة ${contract.propertyGovernorate} بولاية ${contract.propertyWilaya} المرحلة ${contract.propertyPhase}، رقم الأرض ${contract.propertyLandNumber} بمساحة ${contract.propertyArea} متر مربع.
                </div>
                
                <div class="term-item">
                    <span class="term-number">-2</span>
                    يتم البيع بالمبلغ وقدره ${contract.totalPrice.toFixed(3)} (${contract.totalPriceWords}) ريال عماني إذ يتحمل الطرف الأول رسوم نقل الملكية لدى دوائر الإسكان.
                </div>
                
                <div class="term-item">
                    <span class="term-number">-3</span>
                    يقر الطرف الأول بأنه استلم بتاريخ ${formatDate(contract.depositDate)} مبلغ و قدره ${contract.depositAmount.toFixed(3)} (${contract.depositAmountWords}) ريال عماني كمقدم من الثمن و يتبقى المبلغ المتبقي بعد انتهاء من إجراءات نقل الملكيه.
                </div>
                
                <div class="term-item">
                    <span class="term-number">-4</span>
                    ويعتمد الطرف الثاني بتسليم مبلغ وقدره ${contract.remainingAmount.toFixed(3)} (${contract.remainingAmountWords}) ريال عماني بتاريخ ${formatDate(contract.remainingDueDate)} ويكون هذا المتبقي بعد الإنتهاء من الإجراءات بتحويل ${contract.finalPaymentAmount.toFixed(3)} (${contract.finalPaymentAmountWords}) يدفع عند التنازل من دوائر الإسكان.
                </div>
                
                <div class="term-item">
                    <span class="term-number">-5</span>
                    يقر الطرف الأول بأنه معتبر إذ من المعتبر إذ على من الرسوم و الخدمات و المبالغ القانونية و انها غير ملزمة لذلك يكون للطرف الثاني و للشراء مع عدد مطلب بسبب متنافيات.
                </div>
                
                <div class="term-item">
                    <span class="term-number">-6</span>
                    يقر الطرف الأول (المشتري) بأنه تم بمعاينة المنزل تلو على الملكية و الكهرباء الخاصة بالمنزل محل التعاقد و مبيع عدمه أن يقلها للمحامن.
                </div>
                
                <div class="term-item">
                    <span class="term-number">-7</span>
                    ويعتمد الطرف الأول بضمان الإناشاءات والتسريب والتشققات وال يضمن الطرف غير ذلك وانما يتم تسليم الطرف الثاني الفواتير والضمانات من الشركات الموردة للمنتجات، مثال النوافذ تضمنهن الشركة المنفذة.
                </div>
                
                <div class="term-item">
                    <span class="term-number">-8</span>
                    يتحمل الطرف الثاني المشتري قيمة اي تعديلات او اضافات يتم طلبهن بعد توقيع الاتفاق.
                </div>
                
                <div class="term-item">
                    <span class="highlight">ملاحظات:</span> مدة انتهاء المقاول من الإنشاءات وتجهيز المنزل من ${formatDate(contract.constructionStartDate)} الى ${formatDate(contract.constructionEndDate)} واذا تمت اضافة تعديلات سيتم زيادة المدة. ويجب على الطرف الثاني انه لا يتأخر في سداد المبلغ النهائي المتبقي والتنازل في وزارة الاسكان وإلا سيكون بذلك الاتفاق ملغي.
                </div>
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-label">توقيع الطرف الثاني:</div>
                    <div class="signature-line">${contract.buyerSignature || ''}</div>
                </div>
                
                <div class="signature-box">
                    <div class="signature-label">توقيع الطرف الأول:</div>
                    <div class="signature-line">${contract.sellerSignature || ''}</div>
                </div>
            </div>
            
            ${contract.notes ? `<div class="disclaimer">${contract.notes}</div>` : ''}
            
            <div class="footer">
                <div class="footer-content">
                    <div class="footer-item">
                        <span class="footer-icon"><i class="fa-solid fa-mobile-screen-button"></i></span>
                        <span>91997970<br>99171889</span>
                    </div>
                    
                    <div class="footer-item">
                        <span class="footer-icon"><i class="fa-solid fa-phone"></i></span>
                        <span>ص.ب : 500<br>أ.ب: 316</span>
                    </div>
                    
                    <div class="footer-item">
                        <span class="footer-icon"><i class="fa-solid fa-envelope"></i></span>
                        <span>info@telalalbidaya.com</span>
                    </div>
                    
                    <div class="footer-item">
                        <span class="footer-icon"><i class="fa-solid fa-location-dot"></i></span>
                        <span>سلطنة عمان<br>Sultanate of Oman</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Find Chrome executable path
function getChromePath(): string {
    const paths = [
        // Linux (Ubuntu/Debian VPS)
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium",
        // Windows
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
        // Edge (as fallback)
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        // Mac
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ];

    for (const p of paths) {
        try {
            fs.accessSync(p);
            return p;
        } catch {
            continue;
        }
    }

    throw new Error("Chrome/Chromium not found. Please install Chrome or Chromium.");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const contract: SaleContract = body.contract;

        if (!contract) {
            return NextResponse.json(
                { error: "Contract data is required" },
                { status: 400 }
            );
        }

        const chromePath = getChromePath();

        // Launch browser with memory-optimized settings
        const browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
            ],
        });

        const page = await browser.newPage();
        const logoDataUrl = getLogoDataUrl();
        const html = generateHTML(contract, logoDataUrl);

        await page.setContent(html, {
            waitUntil: "networkidle0",
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        await browser.close();

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="sale-contract-${contract.contractNumber}.pdf"`,
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
