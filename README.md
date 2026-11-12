# PM Buddy

An AI thinking partner for pressure testing feature ideas before you build them.

Enter a feature idea. PM Buddy asks three clarifying questions, then produces a structured case: customer segment, value assessment, validation approach, metrics, prioritization, and a verdict (Build, Validate further, or Don't build). Cases get pattern tags so you can spot recurring issues across ideas.

Built by Nikki Safarova as a solo project. Plain HTML and JavaScript with a small Vercel serverless function that calls the Google Gemini API on its free tier.

## Run it

1. Get a free key from Google AI Studio. Do not enable billing on that key's project.
2. Import the repo into Vercel.
3. Add an environment variable named `GEMINI_API_KEY`. Optionally set `GEMINI_MODEL` (default `gemini-3.8-flash`, with automatic fallback to `gemini-3.6-flash` and `gemini-3.5-flash-lite` when busy).
4. Deploy.

The key stays on the server in `api/generate.js`. The browser never sees it. Cases are saved in the browser's localStorage, so they do not sync across devices.

## Notes

- Free tier prompts may be used by Google to improve its products, so do not enter anything confidential.
- The free tier has daily limits. If they are used up, the app shows an error until the limit resets.
