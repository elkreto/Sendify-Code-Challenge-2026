import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import express from "express";
import * as z from "zod/v4";

import { DBSchenkerTracking } from "./tracking.js";

//create MCP server
const server = new McpServer({
    name: "Sendify DB Schenker MCP Server",
    version: "0.0.1",
});

//define reusable schemas 
const nameAddressSchema = z.object({
  code: z.string(),
  address: z.string(),
}); 

const scalarSchema = z.object({
    value: z.number().positive(),
    unit: z.string(),
});

const shipmentLocationSchema = z.object({
  city: z.string().optional(),
  code: z.string(),
  countryCode: z.string(),
  postalCode: z.string().optional()
})

const schemaReason = z.object({
    code: z.string(), 
    description: z.string().optional()
})

const shipmentEventSchema = z.object({
  code: z.string(),
  date: z.string(),
  location: shipmentLocationSchema,
  comment: z.string().optional(),
  recipient: z.string().nullable().optional(),
  reasons: z.array(schemaReason).optional()
})

const shipmentPackageSchema = z.object({
    id: z.string(),
    events: z.array(
        shipmentEventSchema.extend({
            location: z.string(),
        })
    ),
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
            sender: nameAddressSchema,
            reciver: nameAddressSchema,
            details: z.object({
                weight: scalarSchema,
                volume: scalarSchema,
                //no dimensions present in all of the shiments, so optional
                dimensions: z.object({
                    width: z.number().positive(),
                    height: z.number().positive(),
                    length: z.number().positive(),
                }).optional(),
                pieceCnt: z.number().positive(),
            }),
            trackingHistory: z.array(shipmentEventSchema),
            parcelsHistory: z.array(shipmentPackageSchema),
        },
    },
    async ({ trackingNumber }) => {
        console.log("Tracking number:", trackingNumber);

        try {
            const shipmentData = await DBSchenkerTracking.trackShipment(trackingNumber);
            const content = {
                sender: {
                    code: shipmentData.location.collectFrom.city || "N/A",
                    address: `${
                        shipmentData.location.collectFrom.postalCode
                            ? shipmentData.location.collectFrom.postalCode +
                              ", "
                            : ""
                    }${shipmentData.location.collectFrom.countryCode}`,
                },
                reciver: {
                    code: shipmentData.location.deliverTo.city || "N/A",
                    address: `${
                        shipmentData.location.deliverTo.postalCode
                            ? shipmentData.location.deliverTo.postalCode + ", "
                            : ""
                    }${shipmentData.location.deliverTo.countryCode}`,
                },
                details: {
                    weight: shipmentData.goods.weight,
                    volume: shipmentData.goods.volume,
                    pieceCnt: shipmentData.goods.pieces,
                    dimensions:
                        shipmentData.goods.dimensions.length > 0
                            ? {
                                  width: shipmentData.goods.dimensions[0] || 0,
                                  height: shipmentData.goods.dimensions[1] || 0,
                                  length: shipmentData.goods.dimensions[2] || 0,
                              }
                            : undefined,
                },
                trackingHistory: shipmentData.events,
                parcelsHistory: shipmentData.packages,
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
        catch (error) {
            console.error("Error tracking shipment:", error);

            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error tracking shipment: ${error instanceof Error ? error.message : String(error)}`,
                    }
                ]
            }
        }
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
