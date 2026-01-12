import { solvePuzzle } from "./pow.js";

const encodedText = 'ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKd2RYcDZiR1VpT2lKQlFVRkJRVUZCZEdaWVJXTnJRallyTW5sRlMwRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZDY0dodlduRmFaVlYxTkhFM2RWb3hiRFZSVldoc2VEWmhjMkkyUW5JeE9ETnBhbkUyWVUxaVpXbFpaejA5SWl3aWFXRjBJam94TnpZNE1UZ3hNVEl5TENKbGVIQWlPakUzTmpneE9ERXhPREo5LktKdERLc1VwSUYwSExTRXdMNVl2b3R3cHhpZm9tWkRtZVEwdnJnRWc3QjgsZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKd2RYcDZiR1VpT2lKQlFVRkJRVUZDTldvNWJUZHpUbWhoYVVORlMwRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZDY0dodlduRmFaVlYxTkhFM2RWb3hiRFZSVldoc2VEWmhjMkkyUW5JeE9ETnBhbkUyWVUxaVpXbFpaejA5SWl3aWFXRjBJam94TnpZNE1UZ3hNVEl5TENKbGVIQWlPakUzTmpneE9ERXhPREo5Li00TXRieWc1MlVYVlpuaFdtUjc4RUo5c0x4TnV2TUllVS1qTV9rWVR0ZVEsZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKd2RYcDZiR1VpT2lKQlFVRkJRVUZCZDB4dWFDczRiakExTjJsRlMwRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZDY0dodlduRmFaVlYxTkhFM2RWb3hiRFZSVldoc2VEWmhjMkkyUW5JeE9ETnBhbkUyWVUxaVpXbFpaejA5SWl3aWFXRjBJam94TnpZNE1UZ3hNVEl5TENKbGVIQWlPakUzTmpneE9ERXhPREo5LldtQ0tyc3lRSHl0bV83YXNoYXo3WWlmc3RKcE5DUEdWTjd2ZF9LN21VN0k='

//go from base64 to utf-8
const decoded = Buffer.from(encodedText, 'base64').toString();
//split by comma as per the original implementation
const pairs = decoded.split(",").map((m) => {
    const { puzzle } = JSON.parse(Buffer.from(m.split(".")[1], 'base64').toString());
    const puzzleBuffer = Buffer.from(puzzle, 'base64');

    return {
        jwt: m,
        puzzle: new Uint8Array(puzzleBuffer)
    };
});

console.log(pairs);

const solutions = await Promise.all(
    pairs.map(async (p) => ({
        jwt: p.jwt,
        solution: await solvePuzzle(p.puzzle), // Your adapted Worker code
    }))
);
const solutionHeader = Buffer.from(JSON.stringify(solutions)).toString('base64');

console.log(solutionHeader)




