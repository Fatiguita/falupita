import { GoogleGenAI } from "@google/genai";

const getClient = (customKey?: string) => {
  // STRICT BYOK: We do not check process.env.API_KEY here.
  // The user MUST provide a key via the UI settings.
  
  if (!customKey || customKey.trim().length === 0) {
    throw new Error("Missing API Key. Please enter your Gemini API Key in the settings menu.");
  }
  
  // Log confirmation (masked)
  const mask = customKey.slice(-4);
  console.log(`[Falupita] Using Custom Key (...${mask})`);

  return new GoogleGenAI({ apiKey: customKey });
};

/**
 * Generates an image using the 'nano banana' (gemini-2.5-flash-image) model.
 */
export const generateNanoBananaImage = async (prompt: string, inputImageBase64?: string, customApiKey?: string): Promise<string> => {
  try {
    const ai = getClient(customApiKey);
    const modelId = 'gemini-2.5-flash-image';
    
    const parts: any[] = [];
    
    if (inputImageBase64) {
      const base64Data = inputImageBase64.split(',')[1] || inputImageBase64;
      const mimeType = inputImageBase64.match(/data:([^;]+);base64/)?.[1] || 'image/png';
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini.");
    }

    const responseParts = candidates[0].content.parts;
    let resultImage: string | null = null;

    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break; 
      }
    }

    if (!resultImage) {
      throw new Error("No image data found. The model might have returned only text.");
    }

    return resultImage;

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(msg);
  }
};
