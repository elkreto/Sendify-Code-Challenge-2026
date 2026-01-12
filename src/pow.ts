import crypto from 'node:crypto';

// Parity with function r(t)
function generateNonceArray(numberValue: number): Int8Array {
    const n = new Int8Array(8);
    for (let i = 0; i < n.length; i++) {
        const e = 255 & numberValue;
        n[i] = e;
        numberValue = (numberValue - e) / 256;
    }
    return n;
}

// Parity with function n(t, n)
function calculateHashValueSync(nonceArray: Int8Array, puzzleArray: Uint8Array) {
    // Create exactly 40 bytes
    const combined = new Uint8Array(40);

    if (puzzleArray.length < 32) {
        throw new Error("puzzleArray must be at least 32 bytes");
    }
    
    // Only copy the first 32 bytes of the puzzle (Even if puzzleArray is 60 or 64 bytes long)
    for (let i = 0; i < 32; i++) {
        combined[i] = puzzleArray[i]!;
    }

    // Copy the 8 bytes of the nonce into the last 8 slots
    for (let i = 0; i < 8; i++) {
        combined[32 + i] = nonceArray[i]!;
    }

    // Double SHA-256
    const firstHash = crypto.createHash('sha256').update(combined).digest();
    const secondHash = crypto.createHash('sha256').update(firstHash).digest();

    // Convert to BigInt (Little Endian)
    let nBigInt = BigInt(0);
    for (let i = secondHash.length - 1; i >= 0; i--) {
        nBigInt = (nBigInt * BigInt(256)) + BigInt(secondHash[i]!);
    }
    return nBigInt;
}

// Parity with function t(t)
export async function solvePuzzle(puzzleArray: Uint8Array): Promise<string> {
    // Calculate Difficulty Target, uses bytes 13 and 14 of the puzzle
    const targetDifficulty = (function(t13, t14) {
        if(!t13 || !t14) throw new Error("Invalid puzzle array length for difficulty calculation");

        const r = BigInt(8 * (t13 - 3));
        const e = BigInt(2);
        let o = e;
        for (let i = 1; i < r; i++) {
            o *= e;
        }
        return BigInt(t14) * o;
    })(puzzleArray[13], puzzleArray[14]);

   
    let nonceValue = 0;
    let foundSolution = null;

    // The solver loop
    do {
        const nonceArray = generateNonceArray(nonceValue);
        const hashResult = calculateHashValueSync(nonceArray, puzzleArray);

        if (hashResult < targetDifficulty) {
            foundSolution = nonceArray;
            break;
        }
    } while (++nonceValue <= Number.MAX_VALUE);

    if (!foundSolution) return "";

    // Return Base64 string
    return Buffer.from(foundSolution).toString('base64');
}