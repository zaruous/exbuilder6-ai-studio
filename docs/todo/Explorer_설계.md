# Explorer (Together) 기능 설계서

## 1. 개요

사용자가 AI Studio에서 생성한 프로그램(Layout, Script, SQL, Server, Design Doc)을 서버에 등록하고, 다른 사용자가 검색/로드하여 재사용할 수 있는 협업 기능.

현재 `communityService.ts`는 인메모리 MOCK_DB를 사용하며, 이를 실제 서버 API로 교체한다.

### 용어 정의

| 용어 | 설명 |
|------|------|
| Component | 사용자가 등록한 하나의 생성 결과물 (SharedComponent) |
| Together | 협업/공유 도메인 명칭, API prefix에 사용 |
| GenerationResult | clxCode, jsCode, sqlCode, javaFiles, designDoc 등을 포함하는 코드 페이로드 |

---

## 2. 시스템 구성

### 2.1 서버 연결 정보

Settings의 `web-service` provider에 설정된 Endpoint URL의 **루트 주소**를 기반으로 API를 호출한다.

```
예시: web-service baseUrl = http://localhost:8080/api/generate
      → 루트 주소: http://localhost:8080
      → Together API: http://localhost:8080/api/together/...
```

프론트엔드에서 루트 주소 추출:
```typescript
function getServerBaseUrl(settings: GenerationSettings): string {
  const wsUrl = settings.providerConfigs['web-service']?.baseUrl || '';
  // URL에서 /api 이후를 제거하여 루트 추출
  const url = new URL(wsUrl);
  return url.origin;  // http://localhost:8080
}
```

### 2.2 아키텍처 개요

```
┌──────────────────────┐         ┌──────────────────────────────┐
│  Frontend (React)    │         │  Backend (Spring Boot)       │
│                      │  HTTP   │                              │
│  ExploreView.tsx     │◄───────►│  TogetherController.java     │
│  RegisterModal.tsx   │  JSON   │  TogetherService.java        │
│  communityService.ts │         │  TogetherRepository.java     │
│                      │         │  SQLite (together.db)        │
└──────────────────────┘         └──────────────────────────────┘
```

---

## 3. API 설계

### 3.1 엔드포인트 목록

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/together/components` | 컴포넌트 목록 조회 (검색/정렬/페이징) |
| GET | `/api/together/components/{id}` | 컴포넌트 상세 조회 |
| POST | `/api/together/components` | 컴포넌트 등록 |
| PUT | `/api/together/components/{id}` | 컴포넌트 수정 |
| DELETE | `/api/together/components/{id}` | 컴포넌트 삭제 |
| POST | `/api/together/components/{id}/like` | 좋아요 토글 |
| GET | `/api/together/components/{id}/comments` | 댓글 목록 조회 |
| POST | `/api/together/components/{id}/comments` | 댓글 등록 |
| DELETE | `/api/together/comments/{commentId}` | 댓글 삭제 |

### 3.2 상세 API 명세

#### 3.2.1 컴포넌트 목록 조회

```
GET /api/together/components?keyword=&sort=popular&page=0&size=20
```

**Query Parameters:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| keyword | string | "" | 제목/설명/태그 검색어 |
| sort | string | "popular" | 정렬 기준: popular, newest, oldest |
| page | int | 0 | 페이지 번호 (0-based) |
| size | int | 20 | 페이지 크기 |
| tag | string | "" | 태그 필터 (콤마 구분 가능) |
| author | string | "" | 작성자 필터 |

**Response:**
```json
{
  "content": [
    {
      "id": "uuid-string",
      "title": "Customer Registration Form",
      "description": "A standard registration form...",
      "author": "dev_master",
      "likes": 24,
      "tags": ["form", "validation"],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-16T09:00:00Z",
      "commentCount": 5,
      "avgRating": 4.2,
      "hasDesignDoc": true,
      "hasLayout": true,
      "hasScript": true,
      "hasSql": false,
      "hasServer": false
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

> 목록 조회 시 `generationResult` 본문은 포함하지 않는다 (용량 최적화).
> 대신 `hasDesignDoc`, `hasLayout` 등 보유 여부 플래그만 반환.

#### 3.2.2 컴포넌트 상세 조회

```
GET /api/together/components/{id}
```

**Response:**
```json
{
  "id": "uuid-string",
  "title": "Customer Registration Form",
  "description": "A standard registration form...",
  "author": "dev_master",
  "likes": 24,
  "tags": ["form", "validation"],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-16T09:00:00Z",
  "generationResult": {
    "clxCode": "<html ...>...</html>",
    "jsCode": "function onSave() { ... }",
    "sqlCode": "CREATE TABLE ...",
    "javaFiles": [
      {
        "fileName": "UserController.java",
        "packagePath": "com.example.controller",
        "content": "...",
        "type": "controller"
      }
    ],
    "designDoc": "# 화면 설계서\n...",
    "explanation": "Generated explanation",
    "previewMock": "<div>...</div>"
  },
  "comments": [
    {
      "id": "comment-uuid",
      "author": "newbie_dev",
      "content": "Very clean layout!",
      "rating": 5,
      "createdAt": "2025-01-16T09:00:00Z"
    }
  ]
}
```

#### 3.2.3 컴포넌트 등록

```
POST /api/together/components
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Customer Registration Form",
  "description": "A standard registration form with validation...",
  "author": "dev_master",
  "tags": ["form", "validation", "customer"],
  "generationResult": {
    "clxCode": "...",
    "jsCode": "...",
    "sqlCode": "...",
    "javaFiles": [...],
    "designDoc": "...",
    "explanation": "...",
    "previewMock": "..."
  }
}
```

**Response:** 생성된 컴포넌트 상세 (3.2.2와 동일 구조)

**HTTP Status:** `201 Created`

#### 3.2.4 컴포넌트 수정

```
PUT /api/together/components/{id}
```

**Request Body:** 등록과 동일 (변경할 필드만)

**Response:** 수정된 컴포넌트 상세

#### 3.2.5 컴포넌트 삭제

```
DELETE /api/together/components/{id}
```

**Response:** `204 No Content`

#### 3.2.6 좋아요 토글

```
POST /api/together/components/{id}/like
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "browser-fingerprint-or-uuid"
}
```

**Response:**
```json
{
  "likes": 25,
  "liked": true
}
```

> userId는 브라우저에서 생성한 UUID를 localStorage에 저장하여 사용.
> 같은 userId로 다시 호출하면 좋아요 취소 (토글).

#### 3.2.7 댓글 등록

```
POST /api/together/components/{id}/comments
```

**Request Body:**
```json
{
  "author": "newbie_dev",
  "content": "Very clean layout, thanks!",
  "rating": 5
}
```

**Response:** `201 Created` + 생성된 댓글 객체

#### 3.2.8 댓글 삭제

```
DELETE /api/together/comments/{commentId}
```

**Response:** `204 No Content`

---

## 4. 서버 설계 (Spring Boot)

### 4.1 패키지 구조

```
com.example.ai
├── controller/
│   ├── GenerationController.java      (기존)
│   └── TogetherController.java        (신규)
├── dto/
│   ├── together/
│   │   ├── ComponentListResponse.java
│   │   ├── ComponentDetailResponse.java
│   │   ├── ComponentCreateRequest.java
│   │   ├── ComponentUpdateRequest.java
│   │   ├── CommentCreateRequest.java
│   │   ├── LikeRequest.java
│   │   ├── LikeResponse.java
│   │   └── PageResponse.java
│   └── ...                            (기존)
├── service/
│   ├── together/
│   │   └── TogetherService.java       (신규)
│   └── ...                            (기존)
└── repository/
    └── together/
        └── TogetherRepository.java    (신규, SQLite JDBC)
```

### 4.2 DB 스키마 (SQLite)

기존 `ai_history.db`와 별도로 `together.db` 파일 사용.

```sql
-- 컴포넌트 테이블
CREATE TABLE IF NOT EXISTS component (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    author        TEXT NOT NULL DEFAULT 'Anonymous',
    tags          TEXT NOT NULL DEFAULT '[]',           -- JSON array
    likes         INTEGER NOT NULL DEFAULT 0,
    generation_result TEXT NOT NULL DEFAULT '{}',       -- JSON (GenerationResult)
    preview_mock  TEXT DEFAULT '',
    created_at    TEXT NOT NULL,                        -- ISO8601
    updated_at    TEXT NOT NULL                         -- ISO8601
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comment (
    id            TEXT PRIMARY KEY,
    component_id  TEXT NOT NULL,
    author        TEXT NOT NULL DEFAULT 'Anonymous',
    content       TEXT NOT NULL,
    rating        INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    created_at    TEXT NOT NULL,
    FOREIGN KEY (component_id) REFERENCES component(id) ON DELETE CASCADE
);

-- 좋아요 테이블 (중복 방지)
CREATE TABLE IF NOT EXISTS component_like (
    component_id  TEXT NOT NULL,
    user_id       TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    PRIMARY KEY (component_id, user_id),
    FOREIGN KEY (component_id) REFERENCES component(id) ON DELETE CASCADE
);

-- 검색/정렬용 인덱스
CREATE INDEX IF NOT EXISTS idx_component_created ON component(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_component_likes ON component(likes DESC);
CREATE INDEX IF NOT EXISTS idx_comment_component ON comment(component_id);
```

### 4.3 TogetherController 설계

```java
@RestController
@RequestMapping("/api/together")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Together", description = "컴포넌트 공유/협업 API")
public class TogetherController {

    private final TogetherService togetherService;

    @GetMapping("/components")
    @Operation(summary = "컴포넌트 목록 조회")
    public PageResponse<ComponentListResponse> list(
        @RequestParam(defaultValue = "") String keyword,
        @RequestParam(defaultValue = "popular") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String tag,
        @RequestParam(required = false) String author
    ) { ... }

    @GetMapping("/components/{id}")
    @Operation(summary = "컴포넌트 상세 조회")
    public ComponentDetailResponse detail(@PathVariable String id) { ... }

    @PostMapping("/components")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "컴포넌트 등록")
    public ComponentDetailResponse create(
        @RequestBody ComponentCreateRequest request
    ) { ... }

    @PutMapping("/components/{id}")
    @Operation(summary = "컴포넌트 수정")
    public ComponentDetailResponse update(
        @PathVariable String id,
        @RequestBody ComponentUpdateRequest request
    ) { ... }

    @DeleteMapping("/components/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "컴포넌트 삭제")
    public void delete(@PathVariable String id) { ... }

    @PostMapping("/components/{id}/like")
    @Operation(summary = "좋아요 토글")
    public LikeResponse toggleLike(
        @PathVariable String id,
        @RequestBody LikeRequest request
    ) { ... }

    @PostMapping("/components/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "댓글 등록")
    public Comment createComment(
        @PathVariable String id,
        @RequestBody CommentCreateRequest request
    ) { ... }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "댓글 삭제")
    public void deleteComment(@PathVariable String commentId) { ... }
}
```

### 4.4 TogetherService 핵심 로직

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TogetherService {

    private final TogetherRepository repository;

    // 목록 조회: keyword → LIKE 검색 (title, description, tags)
    // sort=popular → ORDER BY likes DESC
    // sort=newest  → ORDER BY created_at DESC
    // 페이징: LIMIT/OFFSET

    // 등록: UUID 생성, generationResult → JSON 직렬화, tags → JSON 배열

    // 좋아요 토글: component_like 테이블에 INSERT/DELETE
    //             → component.likes 카운트 갱신

    // 댓글: comment 테이블 INSERT/DELETE
}
```

### 4.5 TogetherRepository 구현 패턴

기존 `AiHistoryService`와 동일한 패턴으로 SQLite JDBC 직접 사용.

```java
@Repository
@Slf4j
public class TogetherRepository {

    private final String dbPath;
    private final ObjectMapper objectMapper;

    public TogetherRepository(
        @Value("${ai.together.db-path:.db/together.db}") String dbPath,
        ObjectMapper objectMapper
    ) {
        this.dbPath = dbPath;
        this.objectMapper = objectMapper;
        initDatabase();
    }

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection("jdbc:sqlite:" + dbPath);
    }

    private void initDatabase() {
        // CREATE TABLE IF NOT EXISTS ...
    }

    // CRUD 메서드들...
}
```

### 4.6 application.yml 추가 설정

```yaml
ai:
  together:
    db-path: ".db/together.db"
```

---

## 5. 프론트엔드 설계

### 5.1 communityService.ts 변경

기존 MOCK_DB 기반 → 실제 HTTP API 호출로 교체.

```typescript
// services/communityService.ts

import { SharedComponent, GenerationResult, Comment, GenerationSettings } from '../types';

function getBaseUrl(settings: GenerationSettings): string {
  const wsUrl = settings.providerConfigs['web-service']?.baseUrl || '';
  try {
    return new URL(wsUrl).origin;
  } catch {
    return 'http://localhost:8080';
  }
}

// 목록 조회
export async function getSharedComponents(
  settings: GenerationSettings,
  params?: { keyword?: string; sort?: string; page?: number; size?: number; tag?: string }
): Promise<{ content: SharedComponent[]; totalElements: number; totalPages: number }> {
  const base = getBaseUrl(settings);
  const query = new URLSearchParams();
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page != null) query.set('page', String(params.page));
  if (params?.size) query.set('size', String(params.size));
  if (params?.tag) query.set('tag', params.tag);

  const res = await fetch(`${base}/api/together/components?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch components: ${res.status}`);
  return res.json();
}

// 상세 조회
export async function getComponentDetail(
  settings: GenerationSettings,
  id: string
): Promise<SharedComponent> {
  const base = getBaseUrl(settings);
  const res = await fetch(`${base}/api/together/components/${id}`);
  if (!res.ok) throw new Error(`Component not found: ${res.status}`);
  return res.json();
}

// 등록
export async function registerComponent(
  settings: GenerationSettings,
  title: string,
  description: string,
  author: string,
  result: GenerationResult,
  tags?: string[]
): Promise<SharedComponent> {
  const base = getBaseUrl(settings);
  const res = await fetch(`${base}/api/together/components`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, author, tags: tags || ['generated'], generationResult: result }),
  });
  if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
  return res.json();
}

// 좋아요 토글
export async function toggleLike(
  settings: GenerationSettings,
  componentId: string,
  userId: string
): Promise<{ likes: number; liked: boolean }> {
  const base = getBaseUrl(settings);
  const res = await fetch(`${base}/api/together/components/${componentId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`Like failed: ${res.status}`);
  return res.json();
}

// 댓글 등록
export async function addComment(
  settings: GenerationSettings,
  componentId: string,
  author: string,
  content: string,
  rating: number
): Promise<Comment> {
  const base = getBaseUrl(settings);
  const res = await fetch(`${base}/api/together/components/${componentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, content, rating }),
  });
  if (!res.ok) throw new Error(`Comment failed: ${res.status}`);
  return res.json();
}

// 삭제
export async function deleteComponent(
  settings: GenerationSettings,
  id: string
): Promise<void> {
  const base = getBaseUrl(settings);
  const res = await fetch(`${base}/api/together/components/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}
```

### 5.2 types.ts 변경

```typescript
// 기존 SharedComponent에 추가
export interface SharedComponent {
  id: string;
  title: string;
  description: string;
  author: string;
  generationResult: GenerationResult;
  comments: Comment[];
  likes: number;
  createdAt: string;
  updatedAt?: string;       // 추가
  tags: string[];
  commentCount?: number;    // 추가 (목록 조회 시)
  avgRating?: number;       // 추가 (목록 조회 시)
  // 보유 여부 플래그 (목록 조회 시)
  hasDesignDoc?: boolean;
  hasLayout?: boolean;
  hasScript?: boolean;
  hasSql?: boolean;
  hasServer?: boolean;
}
```

### 5.3 App.tsx 변경 포인트

1. `refreshCommunity` 함수에 `settings` 전달
2. `handleRegisterConfirm`에 `settings` 전달
3. `ExploreView`에 `settings` prop 추가
4. `RegisterModal`에 태그 입력 기능 추가 (선택)

### 5.4 ExploreView.tsx 변경 포인트

1. `settings` prop 추가 → API 호출 시 사용
2. 서버 사이드 검색/정렬/페이징으로 전환
3. `searchTerm` 변경 시 debounce 적용 (300ms)
4. 무한 스크롤 또는 페이지네이션 UI 추가
5. 좋아요 버튼 → `toggleLike` API 호출
6. 삭제 기능 추가 (본인 작성분)
7. 서버 연결 실패 시 폴백 메시지 표시

### 5.5 userId 관리

브라우저별 고유 ID를 localStorage에 저장하여 좋아요 중복 방지:

```typescript
function getUserId(): string {
  let id = localStorage.getItem('exbuilder_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('exbuilder_user_id', id);
  }
  return id;
}
```

---

## 6. 에러 처리

### 6.1 서버 응답 형식

```json
{
  "error": "COMPONENT_NOT_FOUND",
  "message": "컴포넌트를 찾을 수 없습니다.",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 6.2 HTTP 상태 코드

| 코드 | 상황 |
|------|------|
| 200 | 정상 조회/수정 |
| 201 | 등록 성공 |
| 204 | 삭제 성공 |
| 400 | 잘못된 요청 (필수 필드 누락 등) |
| 404 | 컴포넌트/댓글 없음 |
| 500 | 서버 내부 오류 |

### 6.3 프론트엔드 폴백

서버 연결 실패 시 기존 MOCK_DB 데이터 또는 빈 목록 표시:

```typescript
export async function getSharedComponents(settings, params) {
  try {
    // ... fetch API
  } catch (err) {
    console.warn('Together API 연결 실패, 로컬 모드로 전환:', err);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
}
```

---

## 7. 구현 순서 (단계별)

### Phase 1: 서버 기본 CRUD
1. `TogetherRepository` — SQLite 테이블 생성 + CRUD
2. `TogetherService` — 비즈니스 로직
3. `TogetherController` — REST 엔드포인트
4. DTO 클래스 생성
5. application.yml 설정 추가

### Phase 2: 프론트엔드 API 연동
1. `communityService.ts` — MOCK → fetch API 교체
2. `App.tsx` — settings 전달 구조 변경
3. `ExploreView.tsx` — 서버 검색/정렬로 전환

### Phase 3: 추가 기능
1. 좋아요 토글 기능
2. 페이지네이션 / 무한 스크롤
3. 태그 필터링 UI
4. 컴포넌트 삭제 기능
5. 검색 debounce

### Phase 4: 고도화 (선택)
1. 컴포넌트 수정 기능
2. 컴포넌트 버전 관리
3. 이미지 썸네일 생성/저장
4. 인기 태그 자동 완성
5. 사용자 프로필/통계

---

## 8. 파일 변경 목록

### 서버 (exbuilder6-ai-server) — 신규 생성

| 파일 | 설명 |
|------|------|
| `controller/TogetherController.java` | REST 컨트롤러 |
| `service/together/TogetherService.java` | 비즈니스 서비스 |
| `repository/together/TogetherRepository.java` | SQLite 데이터 접근 |
| `dto/together/ComponentListResponse.java` | 목록 조회 응답 DTO |
| `dto/together/ComponentDetailResponse.java` | 상세 조회 응답 DTO |
| `dto/together/ComponentCreateRequest.java` | 등록 요청 DTO |
| `dto/together/ComponentUpdateRequest.java` | 수정 요청 DTO |
| `dto/together/CommentCreateRequest.java` | 댓글 요청 DTO |
| `dto/together/LikeRequest.java` | 좋아요 요청 DTO |
| `dto/together/LikeResponse.java` | 좋아요 응답 DTO |
| `dto/together/PageResponse.java` | 페이징 응답 래퍼 |

### 프론트엔드 (exbuilder6-ai-studio) — 수정

| 파일 | 변경 내용 |
|------|-----------|
| `services/communityService.ts` | MOCK → 실제 API 호출로 교체 |
| `types.ts` | SharedComponent 필드 추가 |
| `App.tsx` | settings를 ExploreView/communityService에 전달 |
| `components/ExploreView.tsx` | 서버 사이드 검색/정렬/페이징 적용 |
| `components/RegisterModal.tsx` | 태그 입력 기능 추가 (선택) |

### 서버 설정 — 수정

| 파일 | 변경 내용 |
|------|-----------|
| `application.yml` | `ai.together.db-path` 설정 추가 |
