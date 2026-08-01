import { chromium } from "playwright";
import * as cheerio from "cheerio";
import fs from "fs";

async function getProjectsData() {
    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage();

    const BASE_URL = "https://mapiles.net/property-type/commercial-properties-for-sale/";
    const TOTAL_PAGES = 7;
    const properties = [];

    console.log("Opening page...");

    await page.goto(BASE_URL, {
        waitUntil: "networkidle"
    });

    for (let currentPage = 1; currentPage <= TOTAL_PAGES; currentPage++) {

        console.log(`Listing Page ${currentPage}/${TOTAL_PAGES}`);

        if (currentPage > 1) {

            await Promise.all([
                page.waitForLoadState("networkidle"),
                page.locator(".mh-pagination__item a", {
                    hasText: String(currentPage)
                }).click()
            ]);

        }

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

        if (currentPage === 1) {
            fs.writeFileSync("response.html", html, "utf8");
        }

        const $ = cheerio.load(html);

        console.log("Properties:", $(".mh-property").length);

        $(".mh-property").each((_, element) => {
            properties.push({
                title: $(element)
                    .find("h1,h2,h3")
                    .first()
                    .text()
                    .trim(),

                url: $(element)
                    .find("a")
                    .first()
                    .attr("href")
                    ?.replace("lookaza.com", "mapiles.net"),

                price: $(element)
                    .find(".mh-estate-vertical__primary")
                    .text()
                    .trim()
            });
        });

        console.log(`Collected ${properties.length} properties`);
    }

    console.log(`\nTotal Properties: ${properties.length}\n`);

    for (let i = 0; i < properties.length; i++) {

        const property = properties[i];

        console.log(`[${i + 1}/${properties.length}] ${property.title}`);

        await page.goto(property.url, {
            waitUntil: "networkidle"
        });

        const $ = cheerio.load(await page.content());

        property.description = $(".mh-estate__section--description")
            .text()
            .replace(/\s+/g, " ")
            .trim();

        const attributes = {};

        $(".mh-estate__list__element").each((_, element) => {

            const key = $(element)
                .find("strong")
                .text()
                .replace(":", "")
                .trim();

            const value = $(element)
                .clone()
                .children()
                .remove()
                .end()
                .text()
                .trim();

            attributes[key] = value;
        });

        Object.assign(property, attributes);

        console.log(property);
    }

    fs.writeFileSync(
        "properties.json",
        JSON.stringify(properties, null, 2),
        "utf8"
    );

    console.log("Saved properties.json");

    await browser.close();
}

getProjectsData();