import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import express from "express";
import * as z from "zod/v4";

//create MCP server
const server = new McpServer({
    name: "Sendify DB Schenker MCP Server",
    version: "0.0.1",
});

//register DB Schenker track shipment tool
server.registerTool(
    "dbs-track-shipment",
    {
        description:
            "Track a shipment with DB Schenker using the provided tracking number.",
        inputSchema: {
            trackingNumber: z
                .string()
                .length(
                    10,
                    "DB Schenker tracking numbers are exactly 10 characters long."
                ),
        },
        outputSchema: {
            sender: z.object({
                name: z.string(),
                address: z.string(),
            }),
            reciver: z.object({
                name: z.string(),
                address: z.string(),
            }),
            details: z.object({
                weight: z.number().positive(),
                dimensions: z.object({
                    width: z.number().positive(),
                    height: z.number().positive(),
                    length: z.number().positive(),
                }),
            }),
            trackingHistory: z.array(
                z.object({
                    event: z.string(),
                    date: z.string(),
                    location: z.string(),
                    cause: z.string().optional(),
                })
            ),
        },
    },
    ({ trackingNumber }) => {
        console.log(trackingNumber);

        const content = {
            sender: {
                name: "Sender Name",
                address: "123 Sender St, City, Country",
            },
            reciver: {
                name: "Receiver Name",
                address: "456 Receiver Ave, City, Country",
            },
            details: {
                weight: 5.5,
                dimensions: {
                    width: 30,
                    height: 20,
                    length: 50,
                },
            },
            trackingHistory: [
                {
                    event: "Shipment picked up",
                    date: "2023-10-01T10:00:00Z",
                    location: "City A",
                    
                }
            ]
        };

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(content, null, 2),
                },
            ],
            structuredContent: content,
        };
    }
);

const transport = new StreamableHTTPServerTransport();

const app = express();

async function startServer() {
    await server.connect(transport as Transport);

    app.post("/mcp", express.json(), (req, res) => transport.handleRequest(req, res, req.body));
    app.get("/mcp", (req, res) => transport.handleRequest(req, res));

    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`MCP Server listening on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);    
});

// Handle server shutdown
process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    process.exit(0);
});
