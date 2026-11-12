# PM Buddy

An AI thinking partner for pressure testing feature ideas before you build them.

Enter a feature idea. PM Buddy asks three clarifying questions, then produces a structured case: customer segment, value assessment, validation approach, metrics, prioritization, and a verdict (Build, Validate further, or Don't build). Cases get pattern tags so you can spot recurring issues across ideas.

Built by Nikki Safarova as a solo project. Plain HTML and JavaScript with a small Vercel serverless function that calls the Claude API.

## Run it

1. Import the repo into Vercel.
2. Add an environment variable named `ANTHROPIC_API_KEY`.
3. Deploy.

The API key stays on the server in `api/claude.js`. The browser never sees it. Cases are saved in the browser's localStorage, so they do not sync across devices.

## Status

Working prototype. Each browser gets a small number of free demo cases.
