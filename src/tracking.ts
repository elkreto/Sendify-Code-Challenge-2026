import { generateCaptcha } from "./captcha.js";
import axios, { AxiosError } from "axios";

type ShipmentLocation = {
    city?: string;
    postalCode?: string;
    code?: string;
    countryCode: string;
}

type ShipmentEvent = { 
    code: string;
    date: string;
    location: string;
    comment?: string;
    recipient?: string;
    reasons: string[];
}

type ShipmentPackage = {
    id: string;
    events: ShipmentEvent[];
}

export type ShipmentData = {
    sttNumber: string;
    references: {
        shipper: string[];
        consignee: string[];
    },
    goods: {
        pieces: number;
        volume: {
            value: number;
            unit: string;
        },
        weight: {
            value: number 
            unit: string;
        },
        //not sure, any of the packages have it?
        dimensions: number[];
    },
    events: ShipmentEvent[];
    location: {
        collectFrom: ShipmentLocation;
        deliverTo: ShipmentLocation;
    },
    packages: ShipmentPackage[];
}

export class DBSchenkerTracking {
    private static MAX_RETRIES = 3;
    public static async trackShipment(trackingNumber: string) {
        const sttResponse = await this.sttNumberQuery(trackingNumber);
        const shipmentData = await this.shipmentQuery(sttResponse);

        return shipmentData;
    }

    private static sttNumberQuery (trackingNumber: string, retryCount = 0, captcha: (string | null) = null): Promise<string> {
        return axios.get(`https://www.dbschenker.com/nges-portal/api/public/tracking-public/shipments?query=${trackingNumber}`,
            {
                headers: {
                    "captcha-solution": captcha,
                }
            }
        )
        .then((response) => {
            return response.data.result[0].id;
        })
        .catch(async(err) => {
            const captcha = await this.handleCaptchaError(err, retryCount);
            return this.sttNumberQuery(trackingNumber, retryCount + 1, captcha);            
        });  
    }

    private static shipmentQuery (sttId: string, retryCount = 0, captcha: (string | null) = null): Promise<ShipmentData> {
        return axios.get(`https://www.dbschenker.com/nges-portal/api/public/tracking-public/shipments/land/${sttId}`, 
            {
                headers: {
                    "captcha-solution": captcha,
                }
            }
        )
        .then((response) => {
            return response.data;
        })
        .catch(async (err) => {
            const captcha =await this.handleCaptchaError(err, retryCount);
            return this.shipmentQuery(sttId, retryCount + 1, captcha);
        })
    }

    private static handleCaptchaError(err: AxiosError, retries: number) {
        //429 indicates captcha is required, other errors should be thrown
        if(err?.response?.status !== 429 || retries >= this.MAX_RETRIES) {
            throw new Error(`Failed to track shipment: ${err.message}`);
        }
        const captchaPuzzle = err.response.headers["captcha-puzzle"];
        return generateCaptcha(captchaPuzzle);
    }
}