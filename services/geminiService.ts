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
      description: "Technical photography advice. Provide 2-3 specific, actionable points separated by periods.",
    },
    subjectId: {
      type: Type.STRING,
      description: "A consistent visual identifier for the main subject to help grouping, e.g., 'Man_In_Red_Hat', 'Dog_Spotted'.",
    }
  },
  required: ["quality", "qualityReason", "shotType", "tags", "compositionScore", "technicalAdvice"],
};

export const analyzeFrameWithGemini = async (base64Image: string): Promise<AIAnalysis> => {
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
          { text: "Analyze this video frame as a professional curator. Be strict. Provide a composition score and technical advice." },
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
};

export const enhanceFrameWithGemini = async (base64Image: string, advice: string, type: EnhancementType = EnhancementType.RESTORE): Promise<string | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    let prompt = `Act as a professional photo editor. Enhance this image based on this advice: "${advice}". Sharpen details, fix lighting, and improve color grading.`;

    switch (type) {
      case EnhancementType.UNBLUR:
        prompt = "Aggressively unblur this image. restore facial details, sharpen edges, and reduce noise. Keep the colors natural.";
        break;
      case EnhancementType.REMOVE_BG:
        prompt = "Keep the main subject exactly as is, but change the background to a solid clean white or transparent studio backdrop. High precision masking.";
        break;
      case EnhancementType.CINEMATIC:
        prompt = "Apply a cinematic color grade. Teal and orange look, high contrast, dramatic lighting, 2.35:1 aspect ratio feel (but keep image size). Make it look like a movie still.";
        break;
      case EnhancementType.BOKEH:
        prompt = "Apply a strong portrait mode effect. Keep the subject sharp but apply a creamy bokeh blur to the background to separate the subject.";
        break;
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
    return null;
  }
};