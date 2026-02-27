import { openai } from "@ai-sdk/openai";

// By default, the OpenAI provider looks for the OPENAI_API_KEY environment variable.
// Using this default is safer and works automatically on the server.
export const model = openai("gpt-4o");
