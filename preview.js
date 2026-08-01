import fs from "fs";

import { getProperty } from "./services/property.service.js";
import { buildFlyer } from "./templates/flyer.js";

async function preview() {

    const result = getProperty({
        query: "Beatrice - Lumina Homes Legazpi"
    });

    if (!result.success) {
        console.log(result.message);
        return;
    }

    const html = await buildFlyer(result.property);

    fs.writeFileSync("preview.html", html);

    console.log("✅ Preview generated!");
}

preview();