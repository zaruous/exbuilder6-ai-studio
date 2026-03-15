import { JavaFile } from '../types';

export const SAMPLE_DESIGN_DOC = `
# [기준정보] 공정 설정 화면 설계서

## 1. 화면명
**공정 설정 (Process Configuration)**

---

## 2. 화면 내용 요약
생산 현장의 작업 단계(공정)에 대한 기준 정보를 정의하고 관리하는 화면입니다.

공정별 물류 속성(창고 여부), 시스템 제어 속성(가상 공정, PULL 방식),
외부 시스템 연동(ERP) 설정을 통해 생산 프로세스의 뼈대를 구축합니다.

---

## 3. 화면 이미지 (아스키아트)

    /----------------------------------------------------------------------------\\
    | [ ] 공정 설정                                 전체 메뉴 > 기준정보 > 생산기준정보 > 공정 설정 |
    +----------------------------------------------------------------------------+
    |  공정코드 [__________]  공정명 [__________]  공정유형 [ 선택 v ]               |
    |  공정구분 (●) 생산 공정  (○) 창고 관리                      [ 초기화 ] [ 조회 ] |
    +----------------------------------------------------------------------------+
    |                                                                            |
    | 공정 목록                                                                  |
    | [ 전체 5 ] | [20개씩 보기 v]           [ 엑셀 업로드 ] [ 엑셀 ] [ 삭제 ] [ 신규 ] |
    +----+----+----+----------+----------+----+----+----+----+----+----+----------+
    | □ | No |상세| 공정코드 | 공정명   |단위|창고|가상|시작|PULL|ERP |ERP공정코드|
    +----+----+----+----------+----------+----+----+----+----+----+----+----------+
    | □ | 1  | 🔍 | 001      | 투입     | 개 | [ ]| [ ]| [ ]| [ ]| [ ]|          |
    | □ | 2  | 🔍 | 002      | 반응     | 개 | [ ]| [ ]| [ ]| [ ]| [ ]|          |
    | □ | 3  | 🔍 | 003      | 이송     | 개 | [ ]| [ ]| [ ]| [ ]| [ ]|          |
    | □ | 4  | 🔍 | 004      | 포장     | 개 | [ ]| [ ]| [ ]| [ ]| [ ]|          |
    | □ | 5  | 🔍 | TEST_OP  | 테스트   | KG | [ ]| [ ]| [ ]| [ ]| [ ]|          |
    +----+----+----+----------+----------+----+----+----+----+----+----+----------+

---

## 4. 버튼 설명

| 버튼명     | 기능 설명                                 | 주요 로직                                             |
|------------|--------------------------------------------|--------------------------------------------------------|
| 조회       | 입력된 조건으로 공정 목록을 검색           | 공정코드/명칭 Like 검색, 구분/유형 일치 검색            |
| 초기화     | 검색 조건 필드를 기본값으로 리셋          | processCode, processName 빈값 처리 등                 |
| 엑셀 업로드 | 엑셀 파일을 통해 공정 정보 일괄 등록      | 양식 검증 및 saveProcess 대량 실행                    |
| 엑셀       | 그리드 데이터를 엑셀 파일로 다운로드       | -                                                      |
| 삭제       | 체크된 항목의 공정 정보 삭제              | 사용 중인 공정(BOM, 실적 등) 여부 체크 후 삭제        |
| 신규       | 신규 공정 정보 입력을 위한 팝업 오픈      | 상세 보기와 동일한 팝업 활용                          |

---

## 5. 서비스 처리 (테이블)

| 서비스주소                                                | 메소드 | 기능설명                    | 참조 테이블·SQL (예시)                                                                                       |
|--------------------------------------------|--------|-----------------------------|---------------------------------------------------------------------------------------------------------------|
| /api/basis/proc/listProcessService         | GET    | 공정 목록 조회              | SELECT * FROM TB_PROC_MST WHERE PROC_CD LIKE :procCd AND PROC_NM LIKE :procNm                                  |
| /api/basis/proc/saveProcessService         | POST   | 공정 정보 저장/수정         | MERGE INTO TB_PROC_MST ... WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT ...                        |
| /api/basis/proc/removeProcessService       | DELETE | 선택 공정 삭제              | DELETE FROM TB_PROC_MST WHERE PROC_CD = :procCd                                                                 |
| /api/basis/proc/uploadProcessService       | POST   | 엑셀 데이터 파싱 저장       | (Loop) INSERT INTO TB_PROC_MST (...) VALUES (...)                                                               |

`;

export const SAMPLE_CLX = `<?xml version="1.0" encoding="UTF-8"?>
<form id="formSample" titletext="샘플 화면" style="width:1200px;height:800px;">
  <objects>
    <!-- ── 검색 영역 ─────────────────────────────── -->
    <div id="divSearch" style="left:10px;top:10px;width:1180px;height:70px;border:1px solid #cccccc;">
      <static id="stCd" text="코드" style="left:10px;top:15px;width:50px;height:20px;"/>
      <edit id="edCd" style="left:65px;top:12px;width:140px;height:24px;"/>
      <static id="stNm" text="명칭" style="left:220px;top:15px;width:50px;height:20px;"/>
      <edit id="edNm" style="left:275px;top:12px;width:140px;height:24px;"/>
      <button id="btnReset"  text="초기화" style="left:970px;top:12px;width:60px;height:24px;" onclick="fn_reset"/>
      <button id="btnSearch" text="조회"   style="left:1040px;top:12px;width:60px;height:24px;" onclick="fn_search"/>
    </div>

    <!-- ── 그리드 영역 ─────────────────────────────── -->
    <div id="divGrid" style="left:10px;top:90px;width:1180px;height:660px;">
      <button id="btnNew"    text="신규" style="left:1000px;top:4px;width:55px;height:24px;" onclick="fn_new"/>
      <button id="btnSave"   text="저장" style="left:1060px;top:4px;width:55px;height:24px;" onclick="fn_save"/>
      <button id="btnDelete" text="삭제" style="left:1120px;top:4px;width:55px;height:24px;" onclick="fn_delete"/>
      <grid id="gridMain" style="left:0px;top:34px;width:1180px;height:615px;" binddataset="dsMain">
        <head>
          <column id="cd"   text="코드"  width="100" edittype="normal"/>
          <column id="nm"   text="명칭"  width="200" edittype="normal"/>
          <column id="type" text="유형"  width="100" edittype="combo" combodataset="dsCdType" combocodecol="cd" combodatacol="nm"/>
          <column id="useYn" text="사용" width="60"  edittype="checkbox" checkedvalue="Y" uncheckedvalue="N"/>
          <column id="regDt" text="등록일" width="120" edittype="normal" readonly="true"/>
        </head>
      </grid>
    </div>
  </objects>

  <datasets>
    <dataset id="dsMain"/>
    <dataset id="dsCdType">
      <columninfo>
        <column id="cd" size="20"/>
        <column id="nm" size="100"/>
      </columninfo>
      <rows>
        <row><col>01</col><col>유형A</col></row>
        <row><col>02</col><col>유형B</col></row>
      </rows>
    </dataset>
  </datasets>

  <variables>
    <variable id="gv_serviceid" value=""/>
  </variables>
</form>`;

export const SAMPLE_JS = `// ============================================================
// eXbuilder6 Controller - 샘플 화면
// ============================================================
var objForm;

nexacro.onload = function () {
  objForm = this;
  fn_init();
};

// ── 초기화 ──────────────────────────────────────────────────
function fn_init() {
  fn_search();
}

// ── 조회 ──────────────────────────────────────────────────
function fn_search() {
  var sSvcId = "listMain";
  var sParam = "cd="  + objForm.edCd.value +
               "&nm=" + objForm.edNm.value;
  gfn_callService(sSvcId, sParam, fn_searchCallback);
}

function fn_searchCallback(svcId, errorCode, errorMsg) {
  if (errorCode < 0) {
    gfn_alert("조회 실패: " + errorMsg);
    return;
  }
}

// ── 초기화 버튼 ──────────────────────────────────────────────
function fn_reset() {
  objForm.edCd.set_value("");
  objForm.edNm.set_value("");
  fn_search();
}

// ── 신규 행 추가 ──────────────────────────────────────────────
function fn_new() {
  var nRow = objForm.dsMain.addRow();
  objForm.dsMain.setColumn(nRow, "useYn", "Y");
  objForm.dsMain.setColumn(nRow, "regDt", gfn_getToday());
  objForm.gridMain.setCellPos(nRow, 0);
}

// ── 저장 ──────────────────────────────────────────────────
function fn_save() {
  if (objForm.dsMain.getRowCount() === 0) {
    gfn_alert("저장할 데이터가 없습니다.");
    return;
  }
  gfn_callService("saveMain", "", fn_saveCallback);
}

function fn_saveCallback(svcId, errorCode, errorMsg) {
  if (errorCode < 0) {
    gfn_alert("저장 실패: " + errorMsg);
    return;
  }
  gfn_alert("저장되었습니다.");
  fn_search();
}

// ── 삭제 ──────────────────────────────────────────────────
function fn_delete() {
  var nRow = objForm.gridMain.getCurRow();
  if (nRow < 0) { gfn_alert("삭제할 행을 선택하세요."); return; }
  if (!gfn_confirm("선택한 항목을 삭제하시겠습니까?")) return;

  objForm.dsMain.deleteRow(nRow);
  gfn_callService("deleteMain", "", fn_deleteCallback);
}

function fn_deleteCallback(svcId, errorCode, errorMsg) {
  if (errorCode < 0) {
    gfn_alert("삭제 실패: " + errorMsg);
    return;
  }
  gfn_alert("삭제되었습니다.");
  fn_search();
}`;

export const SAMPLE_SQL = `-- ============================================================
-- MWIPORDSTS 테이블 DDL / DML  (Dialect: POSTGRE)
-- ============================================================

-- ── 테이블 생성 ──────────────────────────────────────────────
CREATE TABLE MWIPORDSTS (
    ORD_NO      VARCHAR(20)   NOT NULL,           -- 주문번호
    STS_CD      VARCHAR(10)   NOT NULL,           -- 상태코드
    STS_NM      VARCHAR(100)  NOT NULL,           -- 상태명
    ORD_DT      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,  -- 주문일시
    STS_DT      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,  -- 상태일시
    USE_YN      CHAR(1)       DEFAULT 'Y',        -- 사용여부
    SORT_ORD    INTEGER       DEFAULT 0,          -- 정렬순서
    REMARK      VARCHAR(500),                     -- 비고
    REG_DT      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,  -- 등록일시
    REG_ID      VARCHAR(20),                      -- 등록자
    UPD_DT      TIMESTAMP,                        -- 수정일시
    UPD_ID      VARCHAR(20),                      -- 수정자
    CONSTRAINT PK_MWIPORDSTS PRIMARY KEY (ORD_NO, STS_CD)
);

COMMENT ON TABLE  MWIPORDSTS          IS '주문상태관리';
COMMENT ON COLUMN MWIPORDSTS.ORD_NO   IS '주문번호 (PK)';
COMMENT ON COLUMN MWIPORDSTS.STS_CD   IS '상태코드 (PK)';
COMMENT ON COLUMN MWIPORDSTS.STS_NM   IS '상태명';
COMMENT ON COLUMN MWIPORDSTS.ORD_DT   IS '주문일시';
COMMENT ON COLUMN MWIPORDSTS.STS_DT   IS '상태일시';
COMMENT ON COLUMN MWIPORDSTS.USE_YN   IS '사용여부 (Y/N)';

-- ── 조회 ──────────────────────────────────────────────
SELECT ORD_NO, STS_CD, STS_NM, ORD_DT, STS_DT, USE_YN, SORT_ORD, REMARK, REG_DT
  FROM MWIPORDSTS
 WHERE USE_YN = 'Y'
   AND ORD_NO LIKE :ordNo || '%'
   AND STS_NM LIKE :stsNm || '%'
 ORDER BY SORT_ORD, ORD_NO, STS_CD;

-- ── 저장 (UPSERT) ──────────────────────────────────────────
INSERT INTO MWIPORDSTS (ORD_NO, STS_CD, STS_NM, ORD_DT, STS_DT, USE_YN, REG_DT, REG_ID, UPD_DT, UPD_ID)
VALUES (:ordNo, :stsCd, :stsNm, :ordDt, :stsDt, :useYn, CURRENT_TIMESTAMP, :userId, CURRENT_TIMESTAMP, :userId)
ON CONFLICT (ORD_NO, STS_CD) DO UPDATE
   SET STS_NM  = EXCLUDED.STS_NM,
       ORD_DT  = EXCLUDED.ORD_DT,
       STS_DT  = EXCLUDED.STS_DT,
       USE_YN  = EXCLUDED.USE_YN,
       UPD_DT  = CURRENT_TIMESTAMP,
       UPD_ID  = EXCLUDED.UPD_ID;

-- ── 삭제 ──────────────────────────────────────────────
DELETE FROM MWIPORDSTS WHERE ORD_NO = :ordNo AND STS_CD = :stsCd;`;

export const getSampleJavaFiles = (pkg: string): JavaFile[] => [
  {
    fileName: 'SampleController.java',
    packagePath: `${pkg}.resource.complex.sample.controller`,
    type: 'controller',
    content: `package ${pkg}.resource.complex.sample.controller;

import ${pkg}.resource.complex.sample.model.Sample;
import ${pkg}.resource.complex.sample.service.SampleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 샘플 Controller
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/sample/main")
public class SampleController {

    private final SampleService sampleService;

    /** 목록 조회 */
    @GetMapping("/listSampleService")
    public List<Sample> listSample(@RequestParam(required = false) String cd,
                                   @RequestParam(required = false) String nm) {
        return sampleService.listSample(cd, nm);
    }

    /** 저장 */
    @PostMapping("/saveSampleService")
    public int saveSample(@RequestBody Sample sample) {
        return sampleService.saveSample(sample);
    }

    /** 삭제 */
    @DeleteMapping("/deleteSampleService")
    public int deleteSample(@RequestParam String cd) {
        return sampleService.deleteSample(cd);
    }
}`,
  },
  {
    fileName: 'SampleService.java',
    packagePath: `${pkg}.resource.complex.sample.service`,
    type: 'service',
    content: `package ${pkg}.resource.complex.sample.service;

import ${pkg}.resource.complex.sample.model.Sample;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * 샘플 Service
 */
@Service
@RequiredArgsConstructor
public class SampleService {

    // private final SampleMapper sampleMapper; // MyBatis 사용 시 주입

    /** 목록 조회 */
    @Transactional(readOnly = true)
    public List<Sample> listSample(String cd, String nm) {
        // return sampleMapper.listSample(cd, nm);
        throw new UnsupportedOperationException("Mapper 연결 후 구현하세요.");
    }

    /** 저장 (신규/수정) */
    @Transactional
    public int saveSample(Sample sample) {
        // return sampleMapper.mergeSample(sample);
        throw new UnsupportedOperationException("Mapper 연결 후 구현하세요.");
    }

    /** 삭제 */
    @Transactional
    public int deleteSample(String cd) {
        // return sampleMapper.deleteSample(cd);
        throw new UnsupportedOperationException("Mapper 연결 후 구현하세요.");
    }
}`,
  },
  {
    fileName: 'Sample.java',
    packagePath: `${pkg}.resource.complex.sample.model`,
    type: 'model',
    content: `package ${pkg}.resource.complex.sample.model;

import lombok.Data;

/**
 * 샘플 Model
 */
@Data
public class Sample {
    /** 코드 */
    private String cd;
    /** 명칭 */
    private String nm;
    /** 유형코드 */
    private String typeCd;
    /** 사용여부 */
    private String useYn;
    /** 정렬순서 */
    private Integer sortOrd;
    /** 비고 */
    private String remark;
    /** 등록자 */
    private String regId;
    /** 수정자 */
    private String updId;
}`,
  },
];
