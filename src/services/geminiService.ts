import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

export function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return null or handle it gracefully if the key is missing in dev
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function analyzeMarketInventory(productList: string) {
  const ai = getAI();
  if (!ai) {
    return "Neural uplink currently offline. Pulse stabilized at baseline levels.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a high-end digital market analyst. Given this inventory: ${productList || 'Empty market'}. Provide a brief 2-sentence market pulse report. Use technical, professional, and slightly futuristic language. Focus on asset liquidity and trends.`,
    });

    return response.text || "Market flow analysis inconclusive. Liquidity remains within expected variance.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Network latency detected in neural analysis module. Liquidity remains stable.";
  }
}
