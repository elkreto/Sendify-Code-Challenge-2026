# Sendify Code Challenge: DB Schenker Shipment Tracker MCP Server

## Instructions to run the code

As a prerequisite you need `npm` and `node` (version 22 recomended).
\
`npm i` to install the dependencies
\
`npm run test` to execute all tests - run request for all of the provided package ids
\
`npm run start` to run the server
\
`npm run dev` to run the server with hot reload functionality

## Docs
All of the files reside in `/src` directory.

`captcha.ts` - contains function to solve puzzle and calculate captcha solution\
`example.js` - contains my initial proof of concept work to verify captcha code with manually pasted input from the browser\
`index.ts` - main server file, whole MCP implementation lies in there\
`pow.ts` - proof of work math from Schenker website rewriten to TypeScript, needed for captcha calculations\
`tracking.test.ts` - tests for *tracking.ts*\
`tracking.ts` - contains logic for making the subsequent requests to obtain the data from Schenker API

## Design/Coding diary
used to show thought process and issues and their solutions throughout the challenge

After evaluating desired technologies that Sendify uses I have settled on TypeScript as its rich library support and my expierience with it are a better fit for the challenge than Go.

Research on MCP standard to confirm which design choices will be the best - settled on stateless http streamable server that will return a json data
main source for the decision: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md

After completing basic mcp setup and testing basic interaction via the @modelcontextprotocol/inspector shifting attention to the core of the task

Indentified two crucial endpoints that get called in order to retrieve all of the needed information:
- https://www.dbschenker.com/nges-portal/api/public/tracking-public/shipments?query=`${shipmentId}`
- https://www.dbschenker.com/nges-portal/api/public/tracking-public/shipments/land/`${sttNumber}`

where STT number is obtained from the first query 

Endpoints are protected, cannot simply access them via curl or other request tool, as the server will return 429, blocking the request.
Most important being `Captcha Solution` header that seems to use a proof of work method as there is no user input needed.  
There are also `XSRF-TOKEN` which can be simply obtained by calling GET on the tracking page and `INGRESSCOOKIE` which presumably we can ignore as its used for loadbalancing.

*later note - XSRF-TOKEN turned out to not be needed, as also its useles in the case of no session being present*

After some digging managed to find the math behind the PoW in the https://www.dbschenker.com/d99c8d9d-f385-4ec5-8ce6-9c02a2b1e51f which looks as follows:

```
async function t(t) {
    const e = function(t, n) {
        const r = BigInt(8 * (t - 3))
          , e = BigInt(2);
        let o = e;
        for (let t = 1; t < r; t++)
            o *= e;
        return BigInt(n) * o
    }(t[13], t[14]);
    return o = await async function(t, e) {
        let o = 0;
        do {
            const a = r(o);
            if (await n(a, t) < e)
                return a
        } while (++o <= Number.MAX_VALUE);
        return new Int8Array(0)
    }(t, e),
    btoa(String.fromCharCode(...new Uint8Array(o)));
    var o
}
async function n(t, n) {
    const r = function(t, n) {
        const r = new Int8Array(40);
        for (let n = 0; n < 32; n++)
            r[n] = t[n];
        for (let t = 32; t < 40; t++)
            r[t] = n[t - 32];
        return r
    }(n, t)
      , e = await crypto.subtle.digest("SHA-256", r)
      , o = await crypto.subtle.digest("SHA-256", e);
    return function(t) {
        let n = BigInt(0);
        for (let r = t.length - 1; r >= 0; r--)
            n = BigInt(n) * BigInt(256),
            n += BigInt(t[r]);
        return n
    }/*
 * @COPYRIGHT (C) 2022 Schenker AG
 *
 * All rights reserved.
 */
    (new Uint8Array(o))
}
function r(t) {
    const n = new Int8Array(8);
    for (let r = 0; r < n.length; r++) {
        const e = 255 & t;
        n[r] = e,
        t = (t - e) / 256
    }
    return n
}
onmessage = ({data: n}) => {
    Promise.all(n.map((async ({jwt: n, puzzle: r}) => ({
        jwt: n,
        solution: await t(r)
    })))).then((t => postMessage(t)))
};
```
With the math function isolated, now I need to retrieve the input provided by the server and then I can mimic and recreate the `Captcha Solution` header to run my requests fully independent. 
After injecting simple script that would log any data sent to service workers I confirmed that each header is constructed with 3 calls to the function with the jwt and puzzle parameters. 

It took me a bit to understand where the input is coming from as I was expecting a separate call to obtain the puzzle and jwt content, but after deeper look at network I saw that there has to be an interceptor in the main branch as a failing request is always repeated for the second time, later with correct headers. This lead to discovery of this code: 

```
class ne {
    constructor(m) {
        this.solver = m,
            this.captchaPuzzleHeader = "Captcha-Puzzle",
            this.captchaSolutionHeader = "Captcha-Solution"
    }
    intercept(m, I) {
        return I.handle(m).pipe((0,
            Ho.W)(G => 429 === G.status ? this.handleCaptcha(G, I, m) : (0,
            $o.$)(G)))
    }
    handleCaptcha(m, I, G) {
        const lt = function Zi(ne) {
            return atob(ne).split(",").map(m => {
                const I = JSON.parse(atob(m.split(".")[1]));
                return {
                    jwt: m,
                    puzzle: Int8Array.from(atob(I.puzzle), Ne => Ne.charCodeAt(0))
                }
            })
        }(m.headers.get(this.captchaPuzzleHeader) ?? "");
        return this.solver.solveCaptcha(lt).pipe((0,
            Ga.Z)(ft => {
            const Ft = ft.filter(Kt => lt.some(yn => yn.jwt === Kt.jwt));
            return function Wo(ne, _, m) {
                return (0,
                    is.v)(() => ne() ? _ : m)
            }(() => Ft.length === lt.length, this.retryWithCaptcha(I, G, btoa(JSON.stringify(Ft))), wa.w)
        }))
    }
    retryWithCaptcha(m, I, G) {
        return m.handle(I.clone({
            headers: I.headers.set(this.captchaSolutionHeader, G)
        }))
    }
    static {
        this.\u0275fac = function(I) {
            return new(I || ne)(b.KVO(qn))
        }
    }
    static {
        this.\u0275prov = b.jDH({
            token: ne,
            factory: ne.\u0275fac
        })
    }
}
```

This told me that the first failed request are as per design and rejected ones have a `Captcha Puzzle` header that serves as the input for the PoW function. 
This piece of code also is important as it shows how both the input from the header is parsed as well as encoded later to be put in the `Captcha Solution` header.

So having an example `Captcha Puzzle` value and the handleCaptcha method
``` 
const encodedText = 'ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKd2RYcDZiR1VpT2lKQlFVRkJRVUZCZEdaWVJXTnJRallyTW5sRlMwRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZDY0dodlduRmFaVlYxTkhFM2RWb3hiRFZSVldoc2VEWmhjMkkyUW5JeE9ETnBhbkUyWVUxaVpXbFpaejA5SWl3aWFXRjBJam94TnpZNE1UZ3hNVEl5TENKbGVIQWlPakUzTmpneE9ERXhPREo5LktKdERLc1VwSUYwSExTRXdMNVl2b3R3cHhpZm9tWkRtZVEwdnJnRWc3QjgsZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKd2RYcDZiR1VpT2lKQlFVRkJRVUZDTldvNWJUZHpUbWhoYVVORlMwRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZDY0dodlduRmFaVlYxTkhFM2RWb3hiRFZSVldoc2VEWmhjMkkyUW5JeE9ETnBhbkUyWVUxaVpXbFpaejA5SWl3aWFXRjBJam94TnpZNE1UZ3hNVEl5TENKbGVIQWlPakUzTmpneE9ERXhPREo5Li00TXRieWc1MlVYVlpuaFdtUjc4RUo5c0x4TnV2TUllVS1qTV9rWVR0ZVEsZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKd2RYcDZiR1VpT2lKQlFVRkJRVUZCZDB4dWFDczRiakExTjJsRlMwRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZDY0dodlduRmFaVlYxTkhFM2RWb3hiRFZSVldoc2VEWmhjMkkyUW5JeE9ETnBhbkUyWVUxaVpXbFpaejA5SWl3aWFXRjBJam94TnpZNE1UZ3hNVEl5TENKbGVIQWlPakUzTmpneE9ERXhPREo5LldtQ0tyc3lRSHl0bV83YXNoYXo3WWlmc3RKcE5DUEdWTjd2ZF9LN21VN0k='
```

we can repeat the steps taken by code to get our 3 pairs of input (see example.js and pow.js for more details)

```
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
```

Checking with the tied input (failed 429 request) and subsequent output (successfull 200 request right after) I managed to reverse engineer the PoW captcha. 
With this every information (and a bit more) is in our reach in fast, lightweight (headless - no ui needed) and reliable fashion. 
Rest was just the case of writing simple class to handle the requests, revalidating captcha and formatting the data. Just to clean up the project I migrated the PoW functions to TypeScript, but that was not strictly neccessary.

Added tests to provide an easy way to verify the behaviour of the core funcitonality. 

## Overview and summary

In general I think I archived all of the desired outcomes of this challenge that I set out for myself.
I suppose by marking the individual tracking events per package this perhaps was indended to be completed with Playwright
or other similar E2E testing tool to interact with UI.
Although I have expierience writing tests with Playwright I assumed a headless solution that is reverse engineering the captcha is cleaner and more efficient. 
Now with this approach it should take less then 1 second to pull the needed data. Direct access also makes it more robust, as UI changes cannot easily disrupt it.

All in I have spent about 6 hours on the assignment, split between three coding sessions. I feel this is quite much for such,
so I refrained from implementing auth for MCP and perhaps adding more documentation beyond the readme.
Nontheless I feel this is fairly complete solution that tackles the problem well 
as well as shows my coding style and thought process in a meaningful fashion. 

It was quite fun to do some reverse engineering on this project, hope to hear from you
#### *Stanislaw Pachnik*

