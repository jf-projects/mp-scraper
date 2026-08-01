import fs from "fs";
import path from "path";

import { generateQRCode } from "../services/qrcode.service.js";

export async function buildFlyer(property) {

    const agentPhotoPath = path.join(
        process.cwd(),
        "public",
        "CarlaFigueroa.png"
    );

    const agentPhoto = fs.readFileSync(agentPhotoPath);

    const agentPhotoBase64 = `data:image/png;base64,${agentPhoto.toString("base64")}`;

    const logoPath = path.join(
        process.cwd(),
        "public",
        "logo.png"
    );

    const logoFile = fs.readFileSync(logoPath);

    const logoBase64 = `data:image/png;base64,${logoFile.toString("base64")}`;

    // Read HTML
    let html = fs.readFileSync(
        path.resolve("templates/flyer.html"),
        "utf8"
    );

    // Read CSS
    const css = fs.readFileSync(
        path.resolve("templates/flyer.css"),
        "utf8"
    );

    // Embed CSS directly into the HTML
    html = html.replace(
        "</head>",
        `<style>${css}</style></head>`
    );

    // Generate QR Code
    const qrCode = await generateQRCode(
        property.url ||
        `https://closedbycarla.com/property/${encodeURIComponent(property.title)}`
    );


    // Property Details
    html = html.replaceAll("{{title}}", property.title || "");
    html = html.replaceAll("{{location}}", property.location || "");
    html = html.replaceAll("{{price}}", property.price || "");
    html = html.replaceAll("{{description}}", property.description || "");

    html = html.replaceAll("{{bedrooms}}", property.bedrooms || "-");
    html = html.replaceAll("{{bathrooms}}", property.bathrooms || "-");
    html = html.replaceAll("{{parking}}", property.carport || "-");
    html = html.replaceAll("{{lotArea}}", property.lot_area || "-");
    html = html.replaceAll("{{floorArea}}", property.floor_area || "-");

    // Images
    html = html.replaceAll(
        "{{heroImage}}",
        property.images?.[0] || ""
    );

    html = html.replaceAll(
        "{{image1}}",
        property.images?.[1] || property.images?.[0] || ""
    );

    html = html.replaceAll(
        "{{image2}}",
        property.images?.[2] || property.images?.[0] || ""
    );

    html = html.replaceAll(
        "{{image3}}",
        property.images?.[3] || property.images?.[0] || ""
    );

    html = html.replaceAll(
        "{{image4}}",
        property.images?.[4] || property.images?.[0] || ""
    );

    // Amenities
    html = html.replaceAll(
        "{{amenities}}",
        property.amenities
    );

    // Company Information
    html = html.replaceAll(
        "{{logo}}",
        logoBase64 || "https://via.placeholder.com/200"
    );

    html = html.replaceAll(
        "{{agentPhoto}}",
        agentPhotoBase64 || "https://via.placeholder.com/200"
    );

    html = html.replaceAll(
        "{{agent}}",
        "Carla Figueroa"
    );

    html = html.replaceAll(
        "{{position}}",
        "Licensed Real Estate Broker"
    );

    html = html.replaceAll(
        "{{phone}}",
        "+63 926 286 1397"
    );

    html = html.replaceAll(
        "{{email}}",
        "florescarla399@gmail.com"
    );

    html = html.replaceAll(
        "{{website}}",
        ""
    );

    html = html.replaceAll(
        "{{tagline}}",
        "Helping you find your dream home."
    );

    html = html.replaceAll(
        "{{qrCode}}",
        qrCode
    );

    return html;
}