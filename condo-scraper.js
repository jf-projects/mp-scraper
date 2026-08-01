import { chromium } from "playwright";
import * as cheerio from "cheerio";
import fs from "fs";

async function getProjectsData() {
    const browser = await chromium.launch({
        headless: true
    });

    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    });

    const page = await context.newPage();

    const BASE_URL = "https://mapiles.ai/for-sale/condominium/?offer_type=for-sale&property_type=condominium";
    const TOTAL_PAGES = 20;
    const properties = [];

    console.log("Opening page...");

    await page.goto(BASE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000
    });

    for (let currentPage = 1; currentPage <= TOTAL_PAGES; currentPage++) {

        const url = `${BASE_URL}&page=${currentPage}`;

        console.log(`Listing Page ${currentPage}/${TOTAL_PAGES}`);
        console.log(`Opening: ${url}`);

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        await page.waitForTimeout(2000);

        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 500;

                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= document.body.scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 300);
            });
        });

        const html = await page.content();

        // if (currentPage === 1) {
        //     fs.writeFileSync("response.html", html, "utf8");
        // }

        const $ = cheerio.load(html);

        $(".property-card ").each((_, element) => {
            
            properties.push({
                title: $(element)
                    .find(".property-title")
                    .text()
                    .trim(),

                url: $(element)
                    .find("a")
                    .first()
                    .attr("href"),

                price: $(element)
                    .find(".property-price")
                    .text()
                    .trim()
                    .replace(/\s+/g, " "),
                location: $(element)
                    .find(".property-location")
                    .text()
                    .trim()
                    .replace(/\s+/g, " "),
                features: $(element)
                    .find(".property-features")
                    .text()
                    .trim()
                    .replace(/\s+/g, " ")


            });
        });

        console.log(`Collected ${properties.length} properties`);
    }

    console.log(`\nTotal Properties: ${properties.length}\n`);
    console.log(JSON.stringify(properties, null, 2));


    for (let i = 0; i < properties.length; i++) {

        try {
            const property = properties[i];

            console.log(`[${i + 1}/${properties.length}] ${property.title}`);

            await page.goto(property.url, {
                waitUntil: "domcontentloaded",
                timeout: 30000
            });

            const $ = cheerio.load(await page.content());

            const attributes = {};

            // Get the description paragraph immediately after the "Description" heading
            const descriptionHtml = $("h2")
                .filter((_, el) => $(el).text().trim() === "Description")
                .next("p")
                .html() ?? "";

            property.description = $("h2")
                .filter((_, el) => $(el).text().trim() === "Description")
                .next("p")
                .text()
                .replace(/\s+/g, " ")
                .trim();

            const lines = descriptionHtml
                .replace(/<br\s*\/?>/gi, "\n")
                .split("\n")
                .map(line => line.replace(/<[^>]+>/g, "").trim())
                .filter(Boolean);

            const sampleComputation = $("h2")
                .filter((_, el) => $(el).text().trim() === "Sample Computation")
                .next("div")
                .text()
                .replace(/\s+/g, " ")
                .trim();

            property.sample_computation = sampleComputation;

            const images = [];

            $(".gallery-filmstrip img").each((_, element) => {

                const src = $(element).attr("src");

                if (!src) {
                    return;
                }

                images.push(
                    src.startsWith("http")
                        ? src
                        : `https://mapiles.ai${src}`
                );
            });

            property.images = images;

            $(".property-highlights-grid .property-highlight-card").each((_, element) => {

                const text = $(element)
                    .find(".property-highlight-label")
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

                // L.A 228.00 sqm
                let match = text.match(/^L\.?A\s+([\d.]+)/i);
                if (match) {
                    attributes.lot_area = `${match[1]} sqm`;
                    return;
                }

                // F.A 190.00 sqm
                match = text.match(/^F\.?A\s+([\d.]+)/i);
                if (match) {
                    attributes.floor_area = `${match[1]} sqm`;
                    return;
                }

                // Bedrooms 4
                match = text.match(/Bedrooms?\s+(\d+)/i);
                if (match) {
                    attributes.bedrooms = Number(match[1]);
                    return;
                }

                // Baths 3
                match = text.match(/Baths?\s+(\d+)/i);
                if (match) {
                    attributes.bathrooms = Number(match[1]);
                    return;
                }

                // Garage 2
                match = text.match(/Garage\s+(\d+)/i);
                if (match) {
                    attributes.carport = Number(match[1]);
                    return;
                }

            });


            const additionalFeatures = [];

            for (const line of lines) {

                const cleanLine = line
                    .replace(/[^\p{L}\p{N}\s:,&()\/+\-.]/gu, "")
                    .trim();

                if (!cleanLine) {
                    continue;
                }

                if (!cleanLine.includes(":")) {
                    additionalFeatures.push(cleanLine);
                    continue;
                }

                const [key, ...value] = cleanLine.split(":");

                const normalizedKey = normalizeKey(key);

                attributes[normalizedKey] = value.join(":").trim();
            }

            if (additionalFeatures.length) {
                attributes.additional_features = additionalFeatures;
            }

            // Property Details section
            $(".card .list-unstyled li").each((_, element) => {

                const text = $(element)
                    .find("div")
                    .text()
                    .trim();

                if (!text.includes(":")) {
                    return;
                }

                const [key, ...value] = text.split(":");

                const normalizedKey = normalizeKey(key);

                attributes[normalizedKey] = value.join(":").trim();
            });


            Object.assign(property, attributes);
        } catch (err) {

            console.error(`Failed: ${property.url}`);
            console.error(err.message);

            continue;
        }

        // Wait before requesting the next property
        await page.waitForTimeout(1500 + Math.random() * 1500);
    }

    fs.writeFileSync(
        "condominium.json",
        JSON.stringify(properties, null, 2),
        "utf8"
    );

    // console.log("Saved properties.json");

    await browser.close();
}

getProjectsData();

function normalizeKey(key) {
    return key
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[\/\\]/g, " ")
        .replace(/[()]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
}
