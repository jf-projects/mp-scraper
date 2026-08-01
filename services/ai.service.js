import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

import { propertyTools } from "../tools/property.tools.js";
import toolRegistry from "../tools/toolRegistry.js";
import { SYSTEM_PROMPT } from "../prompts/systemprompt.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Store conversations in memory
const conversations = new Map();

/**
 * Chat with Gemini
 *
 * @param {Object}
 * @param {string} message
 * @param {string} conversationId
 */
export async function chatWithAI({
    message,
    conversationId = "default"
}) {

    // Create conversation if it doesn't exist
    if (!conversations.has(conversationId)) {
        conversations.set(conversationId, [
            {
                role: "user",
                parts: [
                    {
                        text: SYSTEM_PROMPT
                    }
                ]
            },
            {
                role: "model",
                parts: [
                    {
                        text: "Understood. I'll follow these instructions throughout this conversation."
                    }
                ]
            }
        ]);
    }

    const history = conversations.get(conversationId);

    // Save user's message
    history.push({
        role: "user",
        parts: [
            {
                text: message
            }
        ]
    });

    // First Gemini call
    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: history,
        config: {
            tools: propertyTools
        }
    });

    // Check if Gemini wants to call a tool
    const functionCall =
        response.candidates?.[0]
            ?.content
            ?.parts
            ?.find(part => part.functionCall)
            ?.functionCall;

    // No tool needed
    if (!functionCall) {

        history.push({
            role: "model",
            parts: [
                {
                    text: response.text
                }
            ]
        });

        return {
            reply: response.text,
            conversationId
        };
    }

    // Execute the requested tool
    const tool = toolRegistry[functionCall.name];

    if (!tool) {
        throw new Error(`Unknown tool: ${functionCall.name}`);
    }

    const result = await tool(functionCall.args);

    // Tell Gemini the tool result
    history.push({
        role: "user",
        parts: [
            {
                text: `
Tool "${functionCall.name}" returned:

${JSON.stringify(result, null, 2)}

Answer my previous question using this information.
`
            }
        ]
    });

    // Second Gemini call
    const finalResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: history
    });

    history.push({
        role: "model",
        parts: [
            {
                text: finalResponse.text
            }
        ]
    });

    return {
        reply: finalResponse.text,
        conversationId
    };
}