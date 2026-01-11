# Sendify Code Challenge: DB Schenker Shipment Tracker MCP Server

## About This Challenge

Complete this challenge to fast-track your application for internship or junior developer positions at Sendify. **No CV or cover letter required** - just show us what you can build.

## The Task

Build an MCP (Model Context Protocol) server with a tool that tracks DB Schenker shipments.

### Requirements

Your MCP server must expose a tool that:

1. **Accepts** a DB Schenker tracking reference number as input
2. **Returns** structured shipment information including:
   - Sender information (name, address)
   - Receiver information (name, address)
   - Package details (weight, dimensions, piece count, etc.)
   - Complete tracking history for the shipment
   - **Bonus:** Individual tracking events per package

### Data Source

Use the public DB Schenker tracking website:
```
https://www.dbschenker.com/app/tracking-public/
```

### Example Reference Numbers

Use these reference numbers for testing:

| Reference Number |
|------------------|
| 1806203236       |
| 1806290829       |
| 1806273700       |
| 1806272330       |
| 1806271886       |
| 1806270433       |
| 1806268072       |
| 1806267579       |
| 1806264568       |
| 1806258974       |
| 1806256390       |

## Technical Requirements

- You may use **any programming language**
- Your solution must include clear instructions on:
  - How to set up the environment
  - How to build/install dependencies
  - How to run the MCP server
  - How to test the tool

## What We're Looking For

- **Problem-solving ability** - How do you approach extracting data from a public web interface?
- **Code quality** - Clean, readable, and well-structured code
- **Documentation** - Clear setup and usage instructions
- **Error handling** - Graceful handling of invalid references, network issues, etc.

## MCP Resources

If you're new to MCP (Model Context Protocol):
- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDKs](https://github.com/modelcontextprotocol)

## Submission

1. Create a public GitHub repository with your solution
2. Ensure all setup instructions are included in the README
3. Send us the link to your repository (holger@sendify.se)

## What Happens Next

If your submission meets our criteria, we'll invite you for a technical interview. Be prepared to:

- **Walk us through your code** - Explain your design decisions and architecture
- **Discuss trade-offs** - Why did you choose your approach over alternatives?
- **Answer technical questions** - We may ask you to explain specific parts in detail
- **Talk about improvements** - What would you do differently with more time?

This is your code - own it and be ready to reason about every part of it.

## Questions?

If you need additional test reference numbers or have questions about the challenge, reach out to us:
- Email: holger@sendify.se
- Discord: https://discord.gg/ZCv7dc7UXG

---

Good luck! We're excited to see what you build.
