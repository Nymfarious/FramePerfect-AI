import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysis, FrameQuality, ShotType } from "../types";

// Define the response schema for the model
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    quality: {
      type: Type.STRING,
      enum: ["Fair", "Good", "Excellent"],
      description: "Grade the photo quality based on composition, focus, and lighting. Fair is blurry or poor composition. Good is usable. Excellent is sharp, well-composed, and emotionally resonant.",
    },
    qualityReason: {
      type: Type.STRING,
      description: "A short phrase explaining the grade (e.g., 'Slightly blurry', 'Great smile', 'Perfect lighting').",
    },
    people: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List generic labels for people found (e.g., 'Man', 'Woman', 'Child'). Empty if no people.",
    },
    shotType: {
      type: Type.STRING,
      enum: ["Pose", "Candid", "Unknown"],
      description: "Is the subject posing for the camera or is it a candid moment?",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 descriptive keywords about the scene.",
    },
  },
  required: ["quality", "qualityReason", "shotType", "tags"],
};

export const analyzeFrameWithGemini = async (base64Image: string): Promise<AIAnalysis> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Remove data:image/png;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this video frame as a professional photographer. Be strict with quality grading. Excellent means sharp focus AND great composition.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an expert photo editor AI. Your job is to curate the best frames from a video. Be critical about blur.",
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
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback analysis in case of failure to keep the UI from crashing
    return {
      quality: FrameQuality.FAIR,
      qualityReason: "AI Analysis Failed",
      people: [],
      shotType: ShotType.UNKNOWN,
      tags: ["error"],
    };
  }
};
