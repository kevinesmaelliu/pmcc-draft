
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const fetchStockPrice = async (ticker: string): Promise<{ price: number, source?: string }> => {
  if (!API_KEY || !ticker) return { price: 0 };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `What is the current real-time stock price of ${ticker}? Return only the numeric value (e.g. 150.25).`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    // Match numbers, allowing for commas and decimals
    const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
    const price = match ? parseFloat(match[0].replace(/,/g, '')) : 0;

    let source = undefined;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const webChunk = chunks.find((c: any) => c.web?.uri);
        if (webChunk) source = webChunk.web?.uri;
    }

    return { price, source };

  } catch (error) {
    console.error("Gemini price fetch failed:", error);
    return { price: 0 };
  }
};
