# Swagger ↔ MCP 토큰 절약형 연동 아이디어

## 핵심 개념
OpenAPI(Swagger) 스펙을 MCP Tool로 자동 변환하되,
전체 툴을 LLM에 전달하지 않고 **검색(Search) 후 관련 툴만 전달**하여 토큰을 절약한다.

## 구조 (2단계)

### 1단계: 인덱싱 (서버 시작 시 1회)
- Swagger `/v3/api-docs` 파싱
- 각 endpoint의 operationId + description + tags → 경량 인덱스로 메모리 저장

### 2단계: 실행 시
1. 사용자 질문 수신
2. `search_api(query)` → 관련 endpoint top-2~3개 반환
3. LLM에게 해당 툴 스펙만 전달 (~500 tokens)
4. LLM → 실제 API 호출

## MCP Tool (단 2개)
- `searchApis(query, topK)` : 관련 API 검색, 실행 전 필수 호출
- `callApi(operationId, paramsJson)` : 검색된 API 실제 호출

## 검색 구현 옵션
| 옵션 | 방식 | 비고 |
|------|------|------|
| A | 키워드 매칭 (한/영 매핑) | 구현 쉬움, 추가 토큰 0 |
| B | TF-IDF 코사인 유사도 | 인메모리, 중간 난이도 |
| C | Ollama 임베딩 벡터 검색 | 정확도 높음, 로컬 무료 |

## 토큰 절약 효과
- 기존 (전체 툴 전달): 50개 API 기준 ~15,000 tokens/요청
- 개선 (검색 후 top-3): ~800 tokens/요청 → **약 95% 절약**

## 구현 우선순위
1. `ApiIndexer` - Swagger 파싱 → 경량 인덱스 빌드
2. `KeywordSearch` - 한/영 키워드 매칭
3. `SwaggerExecutor` - operationId → HTTP 호출
4. (선택) 임베딩 검색으로 업그레이드

## 관련 파일
- `McpService.java` - 현재 MCP REST 브리지
- `OllamaLangChain4jAiClient.java` - LangChain4j MCP 클라이언트
- `VllmAiClientLangChain.java` - vLLM LangChain4j 클라이언트
- `AiProperties.java` - MCP 서버 설정
