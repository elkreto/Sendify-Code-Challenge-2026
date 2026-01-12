import { solvePuzzle } from "./pow.js";

export async function generateCaptcha(captchaPuzzle: string) {
    //decode base64
    const decoded = Buffer.from(captchaPuzzle, "base64").toString();

    //split by comma as per the original implementation
    const pairs = decoded.split(",").map((m) => {
        //extract the 2nd part of the JWT
        const extractedPayload = m.split(".")[1];

        if (!extractedPayload) throw new Error("Invalid JWT format");

        //parse payload
        const { puzzle } = JSON.parse(
            Buffer.from(extractedPayload, "base64").toString()
        );

        if (!puzzle || typeof puzzle !== "string") {
            throw new Error("Puzzle property is missing or not a string");
        }
        
        const puzzleBuffer = Buffer.from(puzzle, "base64");

        return {
            jwt: m,
            puzzle: new Uint8Array(puzzleBuffer),
        };
    });

    const solutions = await Promise.all(
        pairs.map(async (p) => ({
            jwt: p.jwt,
            solution: await solvePuzzle(p.puzzle), // solve for the puzzle
        }))
    );

    return Buffer.from(JSON.stringify(solutions)).toString('base64');
}
