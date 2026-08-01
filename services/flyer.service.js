import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

export async function generateFlyer(html) {

    const browser = await chromium.launch({
        headless: true
    });

    // Render at high resolution (A4 @ 300 DPI)
    const page = await browser.newPage({
        viewport: {
            width: 2480,
            height: 3508
        },
        deviceScaleFactor: 1.5
    });

    await page.setContent(html, {
        waitUntil: "networkidle"
    });

    await page.emulateMedia({
        media: "screen"
    });

    const flyer = page.locator(".flyer");

    // High-quality screenshot
    const image = await flyer.screenshot({
        type: "png",
        scale: "device"
    });

    await browser.close();

    // Create PDF
    const pdf = await PDFDocument.create();

    const png = await pdf.embedPng(image);

    const pagePdf = pdf.addPage([png.width, png.height]);

    pagePdf.drawImage(png, {
        x: 0,
        y: 0,
        width: png.width,
        height: png.height
    });

    return Buffer.from(await pdf.save());
}