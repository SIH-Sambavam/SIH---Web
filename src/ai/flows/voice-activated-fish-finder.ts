'use server';
/**
 * @fileOverview An AI agent to help fishermen find fish locations and stock trends via voice queries.
 *
 * - findFishLocation - A function that handles the fish location finding process.
 * - FindFishLocationInput - The input type for the findFishLocation function.
 * - FindFishLocationOutput - The return type for the findFishLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FindFishLocationInputSchema = z.object({
  query: z.string().describe('The voice query from the fisherman, e.g., \"Where can I find Tuna?\"'),
});
export type FindFishLocationInput = z.infer<typeof FindFishLocationInputSchema>;

const FindFishLocationOutputSchema = z.object({
  fishLocation: z.string().describe('The location where the fish can be found, along with stock trends.'),
});
export type FindFishLocationOutput = z.infer<typeof FindFishLocationOutputSchema>;

export async function findFishLocation(input: FindFishLocationInput): Promise<FindFishLocationOutput> {
  const result = await findFishLocationFlow.run(input.query);
  return result.result;
}

const findFishLocationFlow = ai.defineFlow(
  {
    name: 'findFishLocationFlow',
    inputSchema: z.string(),
    outputSchema: FindFishLocationOutputSchema,
  },
  async query => {

    const llmResponse = await ai.generate({
      prompt: `You are a marine biologist expert helping fishermen find fish.

      Based on the fisherman's query, provide the location where the fish can be found, along with stock trends.
      The query is: ${query}
      Include details about the current season and any specific advice for the fisherman.
      If the fish cannot be found or you do not have data, respond appropriately.
      Keep the response concise and to the point.
      `,
      output: {
        schema: FindFishLocationOutputSchema,
      },
    });

    return llmResponse.output!;
  }
);

export const findFishLocationFlowWithConversation = ai.defineFlow({
  name: 'findFishLocationFlowWithConversation',
  inputSchema: z.string(),
  outputSchema: z.string(),
}, async (query: string) => {
  // const history = context?.history;

  const llmResponse = await ai.generate({
    prompt: query,
    output: {
      format: 'text' as const
    }
  });

  return llmResponse.output!;
});
