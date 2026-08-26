# 陈晓满额额度状态与企业消费链路收口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以陈晓 80/80 的满额额度状态为演示数据，将静态原型中的企业本月消费统一为 800 彩豆，并确保成员、消费及企业彩豆页面一致。

**Architecture:** 这是静态 HTML 原型，页面没有共享数据层，因此采用“单一演示口径 + 定向同步 + 文本断言 + 浏览器刷新核验”的方式收口。先以企业彩豆与消费记录页面确定账本和值，再同步用户侧和开发者侧成员展示，最后执行跨页一致性检查。

**Tech Stack:** 原生 HTML、内嵌 CSS/JavaScript、Python 3 文本断言脚本、浏览器本地 HTTP 预览。

## Global Constraints

- 陈晓为已激活成员，周期额度固定为 80 彩豆、已用固定为 80 彩豆、使用率固定为 100%。
- 三级状态口径固定：`< 80%` 正常、`80%~99%` 额度预警、`= 100%` 已达上限。
- 企业本月消费统一为 `800` 彩豆；不得留下相互矛盾的 `820` 或旧消费口径。
- 陈晓只可存在一笔 80 彩豆的企业来源消费，不得残留赵磊或重复消费数据。
- 已达上限状态使用红色文案与红色进度条，并明确达到上限后停止企业来源扣减。
- 只修改静态演示数据与展示逻辑；不增加后端接口、持久化、真实扣减或权限控制。

---

### Task 1: 收口企业彩豆统计与账本

**Files:**
- Modify: `user/enterprise-bean.html`
- Modify: `user/enterprise-bean-members.html`
- Test: `scripts/verify-quota-demo.py`（新建一次性静态断言脚本）

**Interfaces:**
- Consumes: 最终展示口径：企业本月消费 `800`；陈晓 `80/80/100%`。
- Produces: 企业彩豆页与成员额度页统一的统计数、账本数和三级状态信息，供消费与成员页同步使用。

- [ ] **Step 1: 编写静态断言脚本，先定义页面必须包含的演示数据**

创建 `scripts/verify-quota-demo.py`：

```python
from pathlib import Path

checks = {
    "user/enterprise-bean.html": ["800", "陈晓"],
    "user/enterprise-bean-members.html": ["张敏", "王晨", "陈晓", "额度预警", "已达上限", "80", "100%"],
}

for file_name, tokens in checks.items():
    content = Path(file_name).read_text(encoding="utf-8")
    for token in tokens:
        assert token in content, f"{file_name} 缺少 {token}"
```

- [ ] **Step 2: 运行断言，确认当前原型尚未满足最终口径**

运行：

```bash
python3 scripts/verify-quota-demo.py
```

预期：若某项缺失，输出对应页面与 token；记录失败项后继续，不修改断言来规避失败。

- [ ] **Step 3: 修改企业彩豆页的统计卡、账本流水和余额链路**

在 `user/enterprise-bean.html` 中：

1. 将所有“本月企业消费”汇总统一为 `800` 彩豆。
2. 删除或改正所有 `820` 彩豆展示，不保留两套统计口径。
3. 新增或保留唯一一笔“陈晓—企业来源—80 彩豆”的消费扣减流水。
4. 将企业池账本余额按既有期初余额和已有流水重算：只加入这一笔 80 彩豆扣减，不能重复扣减。
5. 将预警统计与辅助文案改为与成员额度页一致的实际人数，且不把“企业池余额预警”和“成员额度预警”混为同一概念。

页面目标片段必须表达：

```html
<span>本月企业消费</span>
<strong>800</strong>
```

以及陈晓对应的 80 彩豆企业来源扣减记录。

- [ ] **Step 4: 修改成员额度页，完整呈现三级状态**

在 `user/enterprise-bean-members.html` 中：

1. 张敏保持 `380 / 1000`、38%、`正常`。
2. 王晨保持 `340 / 400`、85%、`额度预警`。
3. 陈晓固定为 `80 / 80`、100%、`已达上限`，并展示红色状态文案和红色进度条。
4. 说明文案固定表达：“已用达周期额度 80% 触发预警，达 100% 后停止企业扣减”。
5. 将“额度预警成员”统计更新为实际预警成员人数；将已达上限人数单独统计或在同一状态统计中清晰呈现，避免把陈晓误算为预警成员。
6. 清理 `820` 残留。

陈晓行应包含等价信息：

```html
<div class="quota-value">已用 80 / 80</div>
<span class="quota-status danger">已达上限</span>
<div class="quota-progress danger" style="width: 100%"></div>
```

- [ ] **Step 5: 扩充静态断言并运行通过**

将 `scripts/verify-quota-demo.py` 更新为：

```python
for file_name in ["user/enterprise-bean.html", "user/enterprise-bean-members.html"]:
    content = Path(file_name).read_text(encoding="utf-8")
    assert "820" not in content, f"{file_name} 仍存在 820 旧口径"

members = Path("user/enterprise-bean-members.html").read_text(encoding="utf-8")
for token in ["380", "1000", "340", "400", "80 / 80", "100%", "正常", "额度预警", "已达上限"]:
    assert token in members, f"成员额度页缺少 {token}"
```

运行：

```bash
python3 scripts/verify-quota-demo.py
```

预期：退出码 `0`。

- [ ] **Step 6: 检查本任务改动**

运行：

```bash
grep -nE '820|本月企业消费|陈晓|已达上限|额度预警' user/enterprise-bean.html user/enterprise-bean-members.html
```

预期：两页没有 `820`；企业消费为 `800`；陈晓唯一的满额状态信息可追溯。

### Task 2: 收口消费记录与企业消费合计

**Files:**
- Modify: `user/consumption-list.html`
- Modify: `scripts/verify-quota-demo.py`

**Interfaces:**
- Consumes: Task 1 的企业本月消费 `800` 与陈晓单笔企业来源消费 `80`。
- Produces: 与企业彩豆账本一致的消费列表和汇总，供跨页验证使用。

- [ ] **Step 1: 在断言脚本中增加消费页断言并先运行失败**

在 `scripts/verify-quota-demo.py` 追加：

```python
consumption = Path("user/consumption-list.html").read_text(encoding="utf-8")
for token in ["800", "陈晓", "80"]:
    assert token in consumption, f"消费记录页缺少 {token}"
assert "820" not in consumption, "消费记录页仍存在 820 旧口径"
```

运行：

```bash
python3 scripts/verify-quota-demo.py
```

预期：如果当前消费记录并未精确表达陈晓的唯一 80 彩豆记录或还含 820，则失败。

- [ ] **Step 2: 修改消费明细与汇总数据**

在 `user/consumption-list.html` 中：

1. 创建或修正陈晓的一笔消费记录，明确成员、消费金额 `80`、企业来源扣减和消费时间/用途（沿用该页已有字段样式与日期格式）。
2. 将页面内的月度消费总额、筛选统计及分页/底部汇总（如存在）统一为 `800`。
3. 删除重复的陈晓消费、赵磊消费或任何导致合计为 `820` 的遗留展示。
4. 保持张敏与王晨的既有消费不变，避免重写所有历史记录。

陈晓记录应包含等价字段：

```html
<td>陈晓</td>
<td>企业彩豆</td>
<td>80</td>
```

- [ ] **Step 3: 加强消费记录唯一性断言**

将消费相关断言更新为：

```python
assert consumption.count("陈晓") == 1, "消费记录页必须仅保留一笔陈晓消费"
assert consumption.count("80") >= 1, "消费记录页缺少陈晓 80 彩豆消费"
```

如果页面中 `80` 同时用于日期或样式，保持“至少一处”检查，并通过人工文本检查确认表格行的金额字段是 80。

- [ ] **Step 4: 运行断言并做金额检索**

运行：

```bash
python3 scripts/verify-quota-demo.py
grep -nE '陈晓|800|820' user/consumption-list.html
```

预期：断言通过；`820` 无结果；陈晓只对应一条企业来源 80 彩豆消费行。

### Task 3: 收口用户侧与开发者侧成员展示

**Files:**
- Modify: `user/member-list.html`
- Modify: `user/member-view.html`
- Modify: `developer/member-list.html`
- Modify: `developer/member-view.html`
- Modify: `scripts/verify-quota-demo.py`

**Interfaces:**
- Consumes: 陈晓已激活、80/80、已达上限；其他成员张敏正常、王晨预警。
- Produces: 用户侧与开发者侧一致的成员激活状态、额度状态、岗位关联数与详情展示。

- [ ] **Step 1: 增加成员展示一致性断言并先运行**

在 `scripts/verify-quota-demo.py` 追加：

```python
for file_name in [
    "user/member-list.html",
    "user/member-view.html",
    "developer/member-list.html",
    "developer/member-view.html",
]:
    content = Path(file_name).read_text(encoding="utf-8")
    assert "陈晓" in content, f"{file_name} 缺少陈晓"
    assert "赵磊" not in content, f"{file_name} 残留未采用的赵磊数据"
```

运行：

```bash
python3 scripts/verify-quota-demo.py
```

预期：若任一页状态未同步或残留赵磊，脚本失败并指出页面。

- [ ] **Step 2: 修改用户侧成员列表与详情页**

1. 在 `user/member-list.html` 中，把陈晓标记为已激活；调整已激活人数、成员总数或岗位关联数（仅限该页面实际有展示的统计）以反映陈晓已加入。
2. 在 `user/member-view.html` 中，展示陈晓 80/80、100% 和“已达上限”，并明确不可再从企业彩豆扣减。
3. 复用 Task 1 已使用的状态 class（或等效现有样式），使红色语义与成员额度页一致。

详情页目标文案：

```html
<span class="status-danger">已达上限</span>
<p>已用 80 / 80，达到周期额度上限后停止企业来源扣减。</p>
```

- [ ] **Step 3: 修改开发者侧成员列表与详情页**

1. 在 `developer/member-list.html` 中，让陈晓的激活状态、岗位关联与用户侧一致。
2. 在 `developer/member-view.html` 中，对应展示陈晓已激活信息和额度限制结果；如该页面不展示额度，不虚构新的额度组件，只需确保成员身份和岗位关系一致。
3. 清除未采用的赵磊展示数据，避免两个不同“第三成员”同时存在。

- [ ] **Step 4: 运行完整静态断言**

运行：

```bash
python3 scripts/verify-quota-demo.py
```

预期：退出码 `0`；四个成员页面均只使用陈晓，且无赵磊残留。

- [ ] **Step 5: 检查统计值没有硬编码冲突**

运行：

```bash
grep -nE '成员总数|已激活|关联岗位|陈晓|赵磊' user/member-list.html user/member-view.html developer/member-list.html developer/member-view.html
```

预期：四页成员身份、激活状态和实际展示的统计口径相互一致。

### Task 4: 执行跨页静态检查与浏览器验证

**Files:**
- Modify: `scripts/verify-quota-demo.py`（可仅补充检查，不改变页面功能）
- Verify: `user/enterprise-bean.html`
- Verify: `user/enterprise-bean-members.html`
- Verify: `user/consumption-list.html`
- Verify: `user/member-list.html`
- Verify: `user/member-view.html`
- Verify: `developer/member-list.html`
- Verify: `developer/member-view.html`

**Interfaces:**
- Consumes: Tasks 1–3 已完成的静态页面。
- Produces: 可复现的文本断言结果和人工浏览器验证结论。

- [ ] **Step 1: 添加全目录旧口径扫描**

在 `scripts/verify-quota-demo.py` 的末尾增加：

```python
tracked_files = [
    "user/enterprise-bean.html",
    "user/enterprise-bean-members.html",
    "user/consumption-list.html",
    "user/member-list.html",
    "user/member-view.html",
    "developer/member-list.html",
    "developer/member-view.html",
]
for file_name in tracked_files:
    content = Path(file_name).read_text(encoding="utf-8")
    assert "820" not in content, f"{file_name} 残留 820 旧口径"
    assert "赵磊" not in content, f"{file_name} 残留赵磊"
```

- [ ] **Step 2: 运行完整文本验证**

运行：

```bash
python3 scripts/verify-quota-demo.py
grep -RInE '820|赵磊' user/enterprise-bean.html user/enterprise-bean-members.html user/consumption-list.html user/member-list.html user/member-view.html developer/member-list.html developer/member-view.html
```

预期：Python 命令退出码 `0`；`grep` 无匹配。

- [ ] **Step 3: 启动本地静态服务**

运行：

```bash
python3 -m http.server 8765
```

预期：终端显示 `Serving HTTP on ... port 8765`。保持该服务运行，仅用于本地浏览器核验。

- [ ] **Step 4: 强制刷新并按顺序人工验证用户侧页面**

依次打开并使用 `Cmd+Shift+R` 强制刷新：

```text
http://localhost:8765/user/enterprise-bean-members.html
http://localhost:8765/user/enterprise-bean.html
http://localhost:8765/user/consumption-list.html
http://localhost:8765/user/member-list.html
http://localhost:8765/user/member-view.html
```

逐项确认：

1. 成员额度页同时出现张敏正常、王晨额度预警、陈晓已达上限三种状态；颜色与进度条分别为蓝/橙/红。
2. 企业彩豆页本月消费为 800，账本中陈晓扣减为单笔 80，余额没有重复扣减。
3. 消费记录总额为 800，且陈晓企业来源 80 只出现一条。
4. 成员列表和详情页都把陈晓显示为已激活；详情页体现满额限制。

- [ ] **Step 5: 强制刷新并验证开发者侧页面**

依次打开并使用 `Cmd+Shift+R` 强制刷新：

```text
http://localhost:8765/developer/member-list.html
http://localhost:8765/developer/member-view.html
```

预期：陈晓身份、激活状态和岗位关联信息与用户侧一致，不出现赵磊或不同的第三成员。

- [ ] **Step 6: 记录验证结论并清理本地服务**

记录每个页面的验证结果（通过 / 失败及实际截图或可复现现象）。验证结束后停止静态服务进程；不删除原型文件和现有素材。

### Task 5: 审阅改动并提交（仅适用于后续初始化 Git 的仓库）

**Files:**
- Verify: 以上所有修改文件

**Interfaces:**
- Consumes: Tasks 1–4 的已验证结果。
- Produces: 可交付的改动清单；当前目录不是 Git 仓库时不执行提交。

- [ ] **Step 1: 审阅所有改动文件的关键口径**

运行：

```bash
python3 scripts/verify-quota-demo.py
find user developer -type f -name '*.html' -print0 | xargs -0 grep -nE '820|赵磊' || true
```

预期：断言通过，没有 `820` 或赵磊残留。

- [ ] **Step 2: 检查 Git 状态或明确非 Git 交付**

运行：

```bash
git status --short
```

预期：如果显示“not a git repository”，在交付说明中明确该原型目录未纳入 Git，本轮不产生 commit；不得初始化仓库或擅自创建提交。

- [ ] **Step 3: 输出交付三件套**

交付中必须明确：

1. **改动**：统一企业消费 800，陈晓 80/80 满额，三级状态与相关成员/消费/企业池页面同步。
2. **验证**：列出 Python 断言、`grep` 旧口径扫描、浏览器强刷的实际结果；未完成的步骤必须标记“未验证”。
3. **遗留**：静态原型没有真实后端扣减拦截与跨页共享数据源，未来接入时应将额度和账本放入单一数据源。
