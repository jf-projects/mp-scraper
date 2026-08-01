import crypto from "crypto";
import { chatWithAI } from "../services/ai.service.js";

export async function chat(req, res) {

    try {

        let { message, conversationId } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required."
            });
        }

        // Generate a new conversation ID if this is the first message
        if (!conversationId) {
            conversationId = crypto.randomUUID();
        }

        const response = await chatWithAI({
            message,
            conversationId
        });

        return res.json({
            success: true,
            conversationId,
            reply: response.reply
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

}