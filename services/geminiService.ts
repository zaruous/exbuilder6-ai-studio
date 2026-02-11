
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResult, GenerationSettings } from "../types";

// Common System Instructions for all providers
const getSystemInstruction = (settings: GenerationSettings) => {
  const langInstruction = settings.language === 'ko' 
    ? "All explanations and comments must be in Korean." 
    : "All explanations and comments must be in English.";
    
  const commentInstruction = settings.includeComments 
    ? "Include detailed JSDoc/JavaDoc comments for all functions and XML comments for complex layout structures." 
    : "Keep comments minimal and focused on complex logic only.";

  const basePackage = settings.basePackage || "com.example";

  return `You are an expert eXbuilder6 UI and Spring Boot Java developer. 
  ${langInstruction}
  ${commentInstruction}
  
  Tasks:
  1. Generate valid eXbuilder6 .clx XML.
  2. Generate corresponding .js controller logic.
  3. Generate Java Spring Boot server code (Controller, Service, Model).
  
  Java Package Rules:
  - Base Package: ${basePackage}
  - Controller: ${basePackage}.resource.complex.[serviceName].controller
  - Model: ${basePackage}.resource.complex.[serviceName].[serviceName].model (or just .model if cleaner, but favor nested if complexity implies)
  - Service: ${basePackage}.resource.complex.[serviceName].service
  
  Always generate valid, compilable code.`;
};

// JSON Schema for OpenAI/Ollama prompting (since they handle schema differently than Gemini SDK)
const JSON_OUTPUT_PROMPT = `
  You MUST return the result strictly as a valid JSON object matching this TypeScript interface:

  interface GenerationResult {
    clxCode: string; // The XML content for the eXbuilder6 .clx file
    jsCode: string; // The JavaScript content for the eXbuilder6 .js file
    javaFiles: Array<{
       fileName: string; // e.g. "UserService.java"
       packagePath: string; // e.g. "com.example.resource.complex.user.service"
       content: string; // The full Java file content
       type: "controller" | "service" | "model";
    }>;
    logs: string[]; // List of strings describing build steps
    explanation: string; // Summary of what was generated
    previewMock: string; // Simple HTML string to visually mock the component structure (use inline styles)
  }

  Do not include markdown code fences (like \`\`\`json) in the response. Just the raw JSON string.
`;

// Gemini Implementation
async function callGemini(prompt: string, settings: GenerationSettings): Promise<GenerationResult> {
  // Use process.env.API_KEY exclusively as per guidelines.
  // The key's availability is handled externally and is a hard requirement.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = getSystemInstruction(settings);

  const response = await ai.models.generateContent({
    model: settings.modelName || "gemini-3-pro-preview",
    contents: `Generate eXbuilder6 and Java Spring Boot code for: ${prompt}. 
    Provide:
    1. CLX (XML)
    2. JS Controller
    3. List of Java files (Controller, Model, Service) with their full package paths and content.
    4. Logs and explanation.`,
    config: {
      temperature: settings.temperature,
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clxCode: {
            type: Type.STRING,
            description: "The XML content for the eXbuilder6 .clx file.",
          },
          jsCode: {
            type: Type.STRING,
            description: "The JavaScript content for the eXbuilder6 .js file.",
          },
          javaFiles: {
            type: Type.ARRAY,
            description: "List of Java server files generated.",
            items: {
              type: Type.OBJECT,
              properties: {
                fileName: { type: Type.STRING, description: "FileName.java" },
                packagePath: { type: Type.STRING, description: "Full package path (e.g. com.example...)" },
                content: { type: Type.STRING, description: "Full Java file content" },
                type: { type: Type.STRING, enum: ["controller", "service", "model"] }
              },
              required: ["fileName", "packagePath", "content", "type"]
            }
          },
          logs: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of logs detailing the build process.",
          },
          explanation: {
            type: Type.STRING,
            description: "A summary of what was generated.",
          },
          previewMock: {
            type: Type.STRING,
            description: "An HTML string that represents a visual mock of the UI component.",
          }
        },
        required: ["clxCode", "jsCode", "javaFiles", "logs", "explanation"],
      },
    },
  });

  const resultStr = response.text;
  if (!resultStr) throw new Error("Empty response from Gemini");
  return JSON.parse(resultStr) as GenerationResult;
}

// OpenAI / VLLM / Ollama Implementation (via Fetch)
async function callOpenAICompatible(prompt: string, settings: GenerationSettings): Promise<GenerationResult> {
  const baseUrl = settings.baseUrl || (settings.provider === 'ollama' ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1');
  // API Key handling: assuming process.env or dummy for non-Gemini providers as we removed UI input.
  const apiKey = 'sk-dummy'; 
  
  const systemInstruction = getSystemInstruction(settings) + JSON_OUTPUT_PROMPT;

  const body = {
    model: settings.modelName,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    temperature: settings.temperature,
    // Try to enforce JSON mode if supported by the provider
    response_format: { type: "json_object" } 
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Provider Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("Empty content received from provider");

  try {
    // Sometimes models wrap JSON in markdown blocks despite instructions
    const jsonString = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(jsonString) as GenerationResult;
  } catch (e) {
    console.error("JSON Parse Error. Raw content:", content);
    throw new Error("Failed to parse JSON response from AI. Check logs.");
  }
}

// Generic Web Service Implementation
async function callWebService(prompt: string, settings: GenerationSettings): Promise<GenerationResult> {
  if (!settings.baseUrl) throw new Error("Base URL is required for Web Service provider.");
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Removed Authorization header with user provided API key.

  // Send a structured payload that the custom backend can use to generate the result
  const body = {
    prompt: prompt,
    settings: {
      temperature: settings.temperature,
      language: settings.language,
      includeComments: settings.includeComments,
      basePackage: settings.basePackage,
      modelName: settings.modelName // Optional, if the backend supports dynamic model selection
    }
  };

  const response = await fetch(settings.baseUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Web Service Error (${response.status}): ${err}`);
  }

  // Expecting the backend to return the GenerationResult directly
  const data = await response.json();
  
  // Basic validation to ensure it matches GenerationResult structure
  if (!data.clxCode || !data.jsCode) {
    throw new Error("Invalid response structure from Web Service. Expected GenerationResult JSON.");
  }

  return data as GenerationResult;
}

// Main Factory Function
export async function generateExBuilderCode(prompt: string, settings: GenerationSettings): Promise<GenerationResult> {
  switch (settings.provider) {
    case 'openai':
    case 'ollama':
      return callOpenAICompatible(prompt, settings);
    case 'web-service':
      return callWebService(prompt, settings);
    case 'gemini':
    default:
      return callGemini(prompt, settings);
  }
}
