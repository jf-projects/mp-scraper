import express from "express";

import {
    getProperties,
    getProperty,
    previewFlyer,
    downloadFlyer
} from "../controllers/property.controller.js";

const router = express.Router();

router.get("/", getProperties);

// Specific routes first
router.get("/:title/flyer-preview", previewFlyer);
router.get("/:title/flyer", downloadFlyer);

// Generic route last
router.get("/:title", getProperty);

export default router;