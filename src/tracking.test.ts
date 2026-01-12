import assert from "node:assert";
import { describe, it } from "node:test";
import { DBSchenkerTracking } from "./tracking.js";

const trackingIds = [
    1806203236, 1806290829, 1806273700, 1806272330, 1806271886, 1806270433,
    1806268072, 1806267579, 1806264568, 1806258974, 1806256390,
];

describe("DBSchenkerTracking tests", () => {
    it("no error for test ids", async () => {
        const promises = []

        for(let trackingId of trackingIds) { 
            promises.push(DBSchenkerTracking.trackShipment(String(trackingId)));
        }

        return Promise.all(promises)
        .then(() => assert.ok(true, "All promises succeeded"))
        .catch(() => assert.fail())
    })
})