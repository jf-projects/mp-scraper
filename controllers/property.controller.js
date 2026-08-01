import {
    getAllProperties,
    getProperty as getPropertyService
} from "../services/property.service.js";

import { buildFlyer } from "../templates/flyer.js";
import { generateFlyer } from "../services/flyer.service.js";

export function getProperties(req, res) {

    const properties = getAllProperties();

    res.json(properties);
}

export function getProperty(req, res) {

    const { title } = req.params;

    const result = getPropertyService({
        query: decodeURIComponent(title)
    });

    if (!result.success) {
        return res.status(404).json(result);
    }

    res.json(result.property);
}

export async function downloadFlyer(req, res) {

    const { title } = req.params;

    const result = getPropertyService({
        query: decodeURIComponent(title)
    });

    if (!result.success) {
        return res.status(404).json(result);
    }

    const html = await buildFlyer(result.property);

    const pdf = await generateFlyer(html);

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.property.title}.pdf"`
    );

    res.send(pdf);
}

export async function previewFlyer(req, res) {

    const { title } = req.params;

    const result = getPropertyService({
        query: decodeURIComponent(title)
    });

    if (!result.success) {
        return res.status(404).json(result);
    }

    const html = await buildFlyer(result.property);

    res.send(html);
}