
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResult, GenerationSettings, GenerationStage } from "../types";

// Helper to get stage-specific instructions
const getStagePrompt = (stage: GenerationStage, userPrompt: string, context?: Partial<GenerationResult>) => {
  switch (stage) {
    case 'design':
      return `[TASK: DESIGN DOCUMENT GENERATION] 
      Create a detailed screen design document (화면 설계서) in Markdown format for: ${userPrompt}. 
      `;
    case 'sql':
      return `[TASK: SQL GENERATION] 
      Create database tables for: ${userPrompt}. 
      Return only valid SQL scripts for the target DBMS.`;
    case 'server':
      return `[TASK: SERVER GENERATION]
      Create Spring Boot Java files (Controller, Service, Model) based on this SQL:
      ${context?.sqlCode || 'Not provided'}
      Original Requirement: ${userPrompt}`;
    case 'layout':
      return `[TASK: LAYOUT GENERATION]
      Create eXbuilder6 .clx XML code.
      Base on these Server/DB specs:
      ${(context?.javaFiles || []).map(f => f.fileName).join(', ')}
      Original Requirement: ${userPrompt}`;
    case 'script':
      return `[TASK: SCRIPT GENERATION]
      Create eXbuilder6 .js controller code.
      Base on this Layout XML:
      ${context?.clxCode || 'Not provided'}
      Original Requirement: ${userPrompt}`;
  }
};

// Common System Instructions for all providers
const getSystemInstruction = (stage: GenerationStage, settings: GenerationSettings) => {
  const langInstruction = settings.language === 'ko' 
    ? "모든 설명과 주석은 한국어로 작성하세요." 
    : "All explanations and comments must be in English.";
    
  let commentInstruction = settings.includeComments 
    ? "Include detailed JSDoc/JavaDoc comments for all functions and XML comments for complex layout structures." 
    : "Keep comments minimal and focused on complex logic only.";

  
  const basePackage = settings.basePackage || "com.example";
  let systemRulePrompt = "You are an expert eXbuilder6 UI and Spring Boot Java developer. ";
  let stagePrompts = "";

  switch (stage) {
    case 'design':
      systemRulePrompt = "You are an expert UI/UX Designer and Technical Writer. ";
      stagePrompts = `
      Generate a professional screen design document in Markdown. Use Marp-compatible syntax if appropriate (using --- for slide breaks).
        #1. $기능ID. 화면명
        #2. 화면 내용 요약
        #3. 화면 이미지(아스키아트)
          - 필터 영역과 본문 영역 분리하고 필터영역에 검색, 초기화, 조회등 메인 버튼 위치등 필요한 버튼들을 배치 
          - 필요시 저장, 삭제, 추가등의 버튼은 본문 영역 상단에 배치
        #4. 버튼 설명
         |버튼명|기능설명|
        #5. 서비스 처리 (테이블)
          - 기능ID : $기능ID. + 두자리 시퀀스 형태로 표기. 
          - 기능명 : 한글로 기능이름 표기.
          - 메소드 : get,post,delete 등 http 메소드형식 표기.
          - 서비스주소 : RESTAPI 주소 표기 형식은 4레벨로 작성
            -  /v1/모듈/서비스그룹/서비스명
          - 입력파라미터 : 기능 검색에 필요한 파라미터들을 나열.
         |기능ID|기능명|메소드|서비스주소|입력파라미터|기능설명|참조 테이블|SQL|
        #6. 기타 특이사항
         - 팝업의 경우 화면 상단에 팝업명을 표기하고, 화면 하단 우측에 표기.
      `;
      commentInstruction = "";
      break;
    case 'sql':
      systemRulePrompt = "You are an expert database architect and SQL developer. ";
      stagePrompts =  `테이블 목록이 매우 크므로 절대 get_table_list를 먼저 호출하지 마십시오. 대신 search_tables 도구를 사용하여 필요한 키워드로 테이블을 검색한 후, 찾은 테이블에 대해 get_table_schema를 호출하여 구조를 파악하십시오.`;
        break;
    case 'server':
      stagePrompts = `  Java Package Rules:
                    - Base Package: ${basePackage}
                    - Controller: ${basePackage}.resource.complex.[serviceName].controller
                    - Model: ${basePackage}.resource.complex.[serviceName].[serviceName].model
                    - Service: ${basePackage}.resource.complex.[serviceName].service`;
      break;
  }

  return `${systemRulePrompt}
  ${langInstruction}
  ${commentInstruction}
  ${stagePrompts}
  
  Always generate valid, compilable code. Return results in strictly valid JSON.`;
};

// JSON Schema for OpenAI/Ollama prompting
const getJsonSchemaPrompt = (stage: GenerationStage) => {
  const baseSchema = `Return a JSON object with:
    "logs": string[],
    "explanation": string`;

  switch (stage) {
    case 'design': return `${baseSchema}, "designDoc": string (Markdown content)`;
    case 'sql': return `${baseSchema}, "sqlCode": string`;
    case 'server': return `${baseSchema}, "javaFiles": Array<{fileName:string, packagePath:string, content:string, type:"controller"|"service"|"model"}>`;
    case 'layout': return `${baseSchema}, "clxCode": string, "previewMock": string (HTML mockup)`;
    case 'script': return `${baseSchema}, "jsCode": string`;
  }
};

// Unified Request Handler for all Providers per Stage
async function callProviderForStage(
    stage: GenerationStage, 
    prompt: string, 
    settings: GenerationSettings, 
    context?: Partial<GenerationResult>
): Promise<Partial<GenerationResult>> {
    const fullPrompt = getStagePrompt(stage, prompt, context);
    const systemInstruction = getSystemInstruction(stage, settings);
    const currentConfig = settings.providerConfigs[settings.provider];

    if (settings.provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Define dynamic schema based on stage
        const properties: any = {
            logs: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING }
        };

        if (stage === 'design') properties.designDoc = { type: Type.STRING };
        if (stage === 'sql') properties.sqlCode = { type: Type.STRING };
        if (stage === 'server') {
            properties.javaFiles = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        fileName: { type: Type.STRING },
                        packagePath: { type: Type.STRING },
                        content: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["controller", "service", "model"] }
                    },
                    required: ["fileName", "packagePath", "content", "type"]
                }
            };
        }
        if (stage === 'layout') {
            properties.clxCode = { type: Type.STRING };
            properties.previewMock = { type: Type.STRING };
        }
        if (stage === 'script') properties.jsCode = { type: Type.STRING };

        const response = await ai.models.generateContent({
            model: currentConfig.modelName || "gemini-3-pro-preview",
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            config: {
                temperature: settings.temperature,
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: properties,
                    required: ["logs", "explanation"]
                }
            }
        });
        
        if (!response.text) {
            throw new Error("Empty response from AI");
        }
        
        return JSON.parse(response.text);
    } 
    
    if (settings.provider === 'openai' || settings.provider === 'ollama') {
        const isDefaultOllama = settings.provider === 'ollama' && (!currentConfig.baseUrl || currentConfig.baseUrl.includes('localhost:11434'));
        const defaultBaseUrl = settings.provider === 'ollama' ? '/ollama-api/v1' : 'https://api.openai.com/v1';
        let baseUrl = isDefaultOllama ? '/ollama-api/v1' : (currentConfig.baseUrl || defaultBaseUrl);
        
        if (settings.provider === 'ollama' && !baseUrl.includes('/v1')) {
            baseUrl = baseUrl.replace(/\/+$/, "") + "/v1";
        }

        const sanitizedBaseUrl = baseUrl.replace(/\/+$/, "");
        const jsonPrompt = getJsonSchemaPrompt(stage);
        
        const response = await fetch(`${sanitizedBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer sk-dummy` },
            body: JSON.stringify({
                model: currentConfig.modelName,
                messages: [
                    { role: "system", content: systemInstruction + "\n" + jsonPrompt },
                    { role: "user", content: fullPrompt }
                ],
                temperature: settings.temperature,
                response_format: { type: "json_object" } 
            })
        });

        if (!response.ok) throw new Error(`Provider Error: ${await response.text()}`);
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if( stage === 'design' && typeof content === 'string' ) {
            // 앞뒤에 붙은 코드 블록 기호만 정교하게 제거
            const start = content.indexOf('{');
            const end = content.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                return JSON.parse(content.substring(start, end + 1));
            }
        }
        return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
    }

    if (settings.provider === 'web-service') {
        if (!currentConfig.baseUrl) throw new Error("Base URL required.");
        const jsonPrompt = getJsonSchemaPrompt(stage);
        const response = await fetch(currentConfig.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: fullPrompt,
                systemPrompt: systemInstruction + "\n" + jsonPrompt, // 시스템 프롬프트에 JSON 스키마 추가
                stage, // SEND STAGE TO WEB SERVICE
                context, // SEND PREVIOUS CONTEXT
                settings: { ...settings }
            })
        });
        if (!response.ok) throw new Error(`Web Service Error: ${await response.text()}`);
        return await response.json();
    }

    throw new Error("Unsupported provider");
}

// Orchestrator: Runs stages sequentially
export async function generateExBuilderCode(
    prompt: string, 
    settings: GenerationSettings,
    onProgress?: (stage: GenerationStage, partialResult: Partial<GenerationResult>) => void,
    selectedStages?: GenerationStage[]
): Promise<GenerationResult> {
    const allStages: GenerationStage[] = ['sql', 'design' ,'server', 'layout', 'script'];
    
    // 사용자가 선택한 단계가 있더라도, allStages의 순서를 기준으로 필터링하여 실행 순서를 보장합니다.
    const stagesToRun = selectedStages && selectedStages.length > 0 
        ? allStages.filter(stage => selectedStages.includes(stage)) 
        : allStages;
    
    let finalResult: GenerationResult = {
        logs: [`Starting generation for: ${stagesToRun.join(', ')}...`],
        explanation: "",
        javaFiles: []
    };

    for (const stage of stagesToRun) {
        finalResult.logs.push(`Generating ${stage.toUpperCase()}...`);
        const partial = await callProviderForStage(stage, prompt, settings, finalResult);
        
        // Merge results: filter out nulls to prevent overwriting existing data
        const cleanPartial = Object.fromEntries(
            Object.entries(partial).filter(([_, v]) => v !== null && v !== undefined)
        );

        // Remove logs from cleanPartial to prevent overwriting during spread
        const { logs: partialLogs, ...otherPartial } = cleanPartial as any;

        finalResult = {
            ...finalResult,
            ...otherPartial,
            logs: [...finalResult.logs, ...(partialLogs || [])],
            explanation: partial.explanation || finalResult.explanation
        };

        if (onProgress) onProgress(stage, finalResult);
    }

    finalResult.logs.push("Generation Pipeline Complete.");
    return finalResult;
}

