import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysis, FrameQuality, ShotType, EnhancementType } from "../types";

// Define the response schema for the model
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    quality: {
      type: Type.STRING,
      enum: ["Fair", "Good", "Excellent"],
      description: "Grade the photo quality. Fair is blurry/poor. Good is usable. Excellent is professional grade.",
    },
    qualityReason: {
      type: Type.STRING,
      description: "A short phrase explaining the grade.",
    },
    people: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List generic labels for people found (e.g., 'Dad', 'Mom', 'Grandpa', 'Toddler', 'Dog'). If you see a specific family role, guess it.",
    },
    shotType: {
      type: Type.STRING,
      enum: ["Pose", "Candid", "Unknown"],
      description: "Subject pose type.",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 descriptive keywords about the scene (e.g. 'Beach', 'Party', 'Sunset').",
    },
    compositionScore: {
      type: Type.NUMBER,
      description: "Score from 1-10 based on rule of thirds, framing, and depth.",
    },
    technicalAdvice: {
      type: Type.STRING,
      description: "Technical photography advice. Provide exactly 5 specific, actionable points separated by periods.",
    },
    subjectId: {
      type: Type.STRING,
      description: "A consistent visual identifier for the main subject to help grouping, e.g., 'Man_In_Red_Hat', 'Dog_Spotted'.",
    }
  },
  required: ["quality", "qualityReason", "shotType", "tags", "compositionScore", "technicalAdvice"],
};

// Helper for retry with exponential backoff
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Check for Rate Limit (429) or Service Unavailable (503)
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes('429');
    const isServerOverload = error?.status === 503 || error?.code === 503;
    
    if ((isRateLimit || isServerOverload) && retries > 0) {
      console.warn(`Gemini API Busy/Rate Limited. Retrying in ${delay}ms... (Attempts left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const analyzeFrameWithGemini = async (base64Image: string): Promise<AIAnalysis> => {
  return callWithRetry(async () => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: "Analyze this video frame as a professional curator. Be strict. Ignore text overlays (names, UI) when identifying people. Provide a composition score and 5 specific technical improvements." },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const json = JSON.parse(text);

      return {
        quality: json.quality as FrameQuality,
        qualityReason: json.qualityReason,
        people: json.people || [],
        shotType: json.shotType as ShotType,
        tags: json.tags || [],
        compositionScore: json.compositionScore || 5,
        technicalAdvice: json.technicalAdvice || "No advice available",
        subjectId: json.subjectId,
      };

    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      // Re-throw if it's not a generic error so retry can catch it, 
      // otherwise return default to fail gracefully after retries
      if ((error as any)?.status === 429) throw error;
      
      return {
        quality: FrameQuality.FAIR,
        qualityReason: "AI Analysis Failed",
        people: [],
        shotType: ShotType.UNKNOWN,
        tags: [],
        compositionScore: 0,
        technicalAdvice: "Retry analysis",
      };
    }
  });
};

export const enhanceFrameWithGemini = async (base64Image: string, advice: string, type: EnhancementType | EnhancementType[] = EnhancementType.RESTORE): Promise<string | null> => {
  return callWithRetry(async () => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

      const types = Array.isArray(type) ? type : [type];

      let prompt = `Act as a professional photo editor. Enhance this image. 
      
      Primary Instructions: ${advice}
      
      Base Style: Sharpen details, fix lighting, and improve color grading.`;

      if (types.includes(EnhancementType.UNBLUR)) {
        prompt += " Focus heavily on unblurring faces and sharpening edges.";
      }
      if (types.includes(EnhancementType.REMOVE_BG)) {
        prompt += " Keep the main subject exactly as is, but change the background to a solid clean white or transparent studio backdrop.";
      }
      if (types.includes(EnhancementType.CINEMATIC)) {
        prompt += " Apply a cinematic color grade. Teal and orange look, high contrast, dramatic lighting.";
      }
      if (types.includes(EnhancementType.BOKEH)) {
        prompt += " Apply a strong portrait mode effect. Creamy bokeh blur to the background.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: prompt },
          ],
        },
      });

      // Extract the image part from the response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Gemini Enhancement Error:", error);
      // Ensure retry logic catches rate limits
      if ((error as any)?.status === 429) throw error;
      return null;
    }
  });
};