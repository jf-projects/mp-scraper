import "dotenv/config";
import readline from "readline/promises";
import { GoogleGenAI } from "@google/genai";

import { propertyTools } from "./tools/property.tools.js";
import toolRegistry from "./tools/toolRegistry.js";

// Create Gemini client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Create terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const history = [];

// Keep asking questions until user exits
while (true) {

    // Ask the user a question
    const question = await rl.question("\nAsk: ");

    history.push({
        role: "user",
        parts: [
            {
                text: question
            }
        ]
    });

    // Allow user to exit
    if (question.toLowerCase() === "exit") {
        break;
    }

    // Send the user's question to Gemini
    // Gemini will decide if a tool should be called.
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: history,
        config: {
            tools: propertyTools
        }
    });

    // Look for a function call inside Gemini's response
    const functionCall =
        response.candidates?.[0]
            ?.content
            ?.parts
            ?.find(part => part.functionCall)
            ?.functionCall;

    // Gemini answered normally without needing a tool
    if (!functionCall) {

        history.push({
            role: "model",
            parts: [
                {
                    text: response.text
                }
            ]
        });

        // console.log("\nAI:");
        console.log(response.text);

        continue;
    }

    console.log("\nGemini wants to call:");

    console.log(functionCall);

    // Find the correct JavaScript function
    const tool = toolRegistry[functionCall.name];

    if (!tool) {
        console.log("Unknown tool.");
        continue;
    }

    // Execute our tool
    const result = await tool(functionCall.args);

    console.log("\nTool Result:");

    console.log(result);

    // 👇 Add the tool result to the conversation history
    history.push({
        role: "user",
        parts: [
            {
                text: `
Tool "${functionCall.name}" returned:

${JSON.stringify(result, null, 2)}

Please answer my previous question using this information.
`
            }
        ]
    });

    // Give the tool result back to Gemini
    // Gemini now writes the final answer.
    const finalResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: history
    });

    console.log("\nAI:");

    console.log(finalResponse.text);

    history.push({
        role: "model",
        parts: [
            {
                text: finalResponse.text
            }
        ]
    });
}

rl.close();