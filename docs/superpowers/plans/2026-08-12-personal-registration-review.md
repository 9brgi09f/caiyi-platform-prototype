# 个人用户统一注册审核 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将个人用户纳入与企业/机构共用的运营注册审核队列，审核通过后激活账号并发放新用户免费体验权益。

**Architecture:** 项目维持纯静态 HTML 原型，不新增服务端或依赖。用户端个人注册提交后展示待审核状态；运营端注册审核列表新增个人用户条目并复用现有通过、驳回交互；方案与流程图统一把权益初始化时点改为审核通过。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Python `html.parser` 静态校验、Git、Cloudflare Pages。

## Global Constraints

- 个人用户与企业/机构共用运营端“注册审核”队列。
- 个人用户无需营业执照和统一社会信用代码，仅提交实名、手机号、密码、验证码与协议资料。
- 个人用户仅在运营审核通过后激活平台个人账号，并按当前规则获得每个智能体的一次性免费体验资格。
- 审核驳回后，个人用户可修改实名资料并重新提交；不得发放权益。
- 保留平台个人账号手机号唯一、机构身份关联和权益“平台个人账号 × 智能体”累计模型。
- 不修改 `user/login.html` 已锁定的视觉样式。
- 不新增框架、构建工具或第三方依赖。

---

### Task 1: 调整个人注册提交与结果页

**Files:**
- Modify: `user/register-form.html`
- Modify: `user/register-success.html`
- Modify: `user/register-result.html`

**Interfaces:**
- Consumes: `register-form.html` 的个人用户提交交互、`register-success.html?type=individual` 的个人注册提交结果、`register-result.html?status=approved|pending|rejected` 的审核结果演示参数。
- Produces: 个人用户提交后进入待审核状态；审核通过结果页展示个人账号已激活、体验权益到账、进入智能体市场入口；审核驳回入口可修改并重新提交。

- [ ] **Step 1: 写入静态断言，先确认当前免审表述仍存在**

```bash
rg -n '免审|自动开通|账户已开通|无需审核' \
  user/register-form.html user/register-success.html user/register-result.html
```

Expected: 至少命中个人用户免审或自动开通文案，作为改动前基线。

- [ ] **Step 2: 修改个人注册提交后的页面文案与跳转**

在 `user/register-form.html` 的个人用户提交分支中，将提交成功后的跳转统一指向：

```js
location.href = 'register-success.html?type=individual';
```

在 `user/register-success.html` 的 `individualView` 中替换为：

```html
<h2 class="result-title">申请已提交，等待审核</h2>
<p class="result-sub">我们已收到您的个人账号申请，审核完成后将通过短信通知您。</p>
<div class="notice-box">审核通过后将激活个人账号，并按当前规则发放新用户免费体验权益。</div>
<div class="btn-row">
  <a class="btn btn-primary" href="register-select.html?modal=status">查看审核状态</a>
  <a class="btn btn-outline" href="../index.html">返回首页</a>
</div>
```

保留企业/机构待审核视图，不改变其营业执照说明。

- [ ] **Step 3: 补全个人审核通过与驳回状态**

在 `user/register-result.html` 中让 `?status=approved&type=individual` 识别个人类型，并展示：

```html
<h2 class="result-title">个人账号审核已通过</h2>
<p class="result-sub">您的个人账号已激活，现在可登录并使用平台服务。</p>
<div class="alert-box success">
  <div class="alert-title">新用户体验权益已到账</div>
  每个智能体可免费体验 20 次；调用成功后优先扣减免费次数，次数用完后按当前计费规则收费。
</div>
<div class="btn-row">
  <a class="btn btn-p" href="agent-list.html">进入智能体市场 →</a>
  <a class="btn btn-o" href="login.html">立即登录</a>
</div>
```

个人用户处于 `pending` 时显示“个人账号申请正在审核中”；处于 `rejected` 时把主按钮指向 `register-form.html?type=individual`，文案为“修改实名资料并重新提交 →”。企业/机构既有 approved、pending、rejected 视图保持可用。

- [ ] **Step 4: 校验用户端页面结构及免审文案清除**

```bash
python3 - <<'PY'
from html.parser import HTMLParser
for path in ['user/register-form.html', 'user/register-success.html', 'user/register-result.html']:
    parser = HTMLParser(convert_charrefs=True)
    parser.feed(open(path, encoding='utf-8').read())
    parser.close()
    print(f'{path}: HTML parse OK')
PY
! rg -n '个人用户无需审核|个人用户免审开通|自动开通试用' \
  user/register-form.html user/register-success.html user/register-result.html
rg -n '个人账号申请正在审核中|个人账号审核已通过|修改实名资料并重新提交' \
  user/register-success.html user/register-result.html
```

Expected: HTML 解析通过；用户端不存在个人免审、自动开通表述；三个个人审核状态文案均可定位。

- [ ] **Step 5: 提交用户端审核状态改动**

```bash
git add user/register-form.html user/register-success.html user/register-result.html
git commit -m "feat: route personal registration through review"
```

### Task 2: 让运营端审核队列覆盖个人用户

**Files:**
- Modify: `admin/register-audit-list.html`
- Modify: `admin/register-audit-detail.html`
- Modify: `admin/org-type-list.html`
- Modify: `admin/personal-account-view.html`

**Interfaces:**
- Consumes: 运营端审核列表的模拟数据和 `register-audit-detail.html?id=<id>` 路由。
- Produces: “个人用户”可在注册审核列表中被识别、查看、通过和驳回；通过后个人账号激活并获得免费权益；账号详情显示审核来源与已激活状态。

- [ ] **Step 1: 写入静态断言，确认运营端当前过滤或排除了个人用户**

```bash
rg -n '个人用户|免审|register-audit-detail' \
  admin/register-audit-list.html admin/register-audit-detail.html admin/org-type-list.html
```

Expected: 能定位当前个人账号或免审说明，为新增审核条目提供基线。

- [ ] **Step 2: 在注册审核列表加入个人用户模拟申请**

在 `admin/register-audit-list.html` 的待审核数据中加入一条个人申请，字段固定为：

```html
<td>张三</td>
<td><span class="badge" style="background:#DBEAFE;color:#2563EB;">个人用户</span></td>
<td>138****8888</td>
<td>2026-08-11 11:30</td>
<td><a class="btn btn-sm btn-outline" href="register-audit-detail.html?id=personal-1">审核</a></td>
```

列表页不为该条目展示营业执照或统一社会信用代码列值；如现有表格有组织名称列，则显示“个人实名申请”。

- [ ] **Step 3: 让审核详情支持个人资料与审核结果**

在 `admin/register-audit-detail.html` 的 `demoData` 增加：

```js
'personal-1': {
  isPersonal: true,
  org: '个人实名申请',
  type: '个人用户',
  person: '张三',
  phone: '13812341234',
  time: '2026-08-11 11:30'
}
```

DOM 初始化时：
- `isPersonal` 为真时隐藏营业执照卡片、统一社会信用代码字段；
- 机构信息标题改为“个人申请信息”；
- 审核通过确认文案改为“审核通过后，将激活该个人账号；若该申请人为首次完成平台注册的新用户，将按当前规则发放免费体验资格。”；
- 通过成功弹窗改为“个人账号已激活。该申请人为首次完成平台注册的新用户，已按当前规则获得每个智能体的免费体验资格。”。

企业/机构数据保持原逻辑和页面展示。

- [ ] **Step 4: 对齐个人账号详情的状态口径**

在 `admin/personal-account-view.html` 的演示数据中，为新审核通过的个人用户增加：

```js
source: '公开注册 · 运营审核通过',
status: '已激活',
freeBenefits: [{ agent: '合规监测智能体', initial: 20, used: 0, left: 20 }]
```

在 `admin/org-type-list.html` 个人账号页的说明中删除“个人用户免审”表述，并描述为“个人账号注册后由运营审核，通过后激活”。

- [ ] **Step 5: 校验运营端个人审核闭环**

```bash
python3 - <<'PY'
from html.parser import HTMLParser
for path in [
    'admin/register-audit-list.html',
    'admin/register-audit-detail.html',
    'admin/org-type-list.html',
    'admin/personal-account-view.html'
]:
    parser = HTMLParser(convert_charrefs=True)
    parser.feed(open(path, encoding='utf-8').read())
    parser.close()
    print(f'{path}: HTML parse OK')
PY
rg -n 'personal-1|个人实名申请|个人账号已激活|公开注册 · 运营审核通过' \
  admin/register-audit-list.html admin/register-audit-detail.html \
  admin/org-type-list.html admin/personal-account-view.html
```

Expected: HTML 解析通过；个人申请能从列表进入详情，详情含个人数据分支及审核通过权益文案。

- [ ] **Step 6: 提交运营审核闭环改动**

```bash
git add admin/register-audit-list.html admin/register-audit-detail.html \
  admin/org-type-list.html admin/personal-account-view.html
git commit -m "feat: include personal registration in operations review"
```

### Task 3: 对齐权益发放、流程图和方案口径

**Files:**
- Modify: `用户注册流程图.html`
- Modify: `用户注册与机构类型设计方案.html`
- Modify: `智能体双模式计费与新用户免费体验产品方案.html`
- Modify: `index.html`

**Interfaces:**
- Consumes: 已确认的统一审核规则：个人用户无营业执照，审核通过后激活和发权益。
- Produces: 所有流程与方案文档中的个人用户权益初始化时点统一为“运营审核通过后”。

- [ ] **Step 1: 写入静态断言，确认旧口径分布**

```bash
rg -n '免审|自动开通|注册成功后|个人用户注册成功' \
  用户注册流程图.html 用户注册与机构类型设计方案.html \
  智能体双模式计费与新用户免费体验产品方案.html index.html
```

Expected: 命中旧的个人用户免审或自动开通表述。

- [ ] **Step 2: 重写流程图的个人注册路径**

在 `用户注册流程图.html` 的个人分支替换为：

```html
<div class="node">填写个人实名与账号信息<div class="sub">姓名 · 身份证号 · 手机号 · 密码 · 协议</div></div><span class="arrow">→</span>
<div class="node">提交注册申请</div><span class="arrow">→</span>
<div class="node state-node">【提交待审核】</div>
```

在运营审核通过分支中明确两类通过结果：

```html
<div class="node state-node">【账号 / 机构身份已激活】</div><span class="arrow">→</span>
<div class="node">初始化新用户免费体验资格</div><span class="arrow">→</span>
<div class="node end-node">登录并使用平台</div>
```

个人路径不出现营业执照、统一社会信用代码或机构主账号成员关系。

- [ ] **Step 3: 更新账号设计方案的规则和验收项**

在 `用户注册与机构类型设计方案.html` 中统一替换：
- “个人用户免审开通” → “个人用户提交实名资料后进入运营审核”；
- “个人用户免审开通后生效” → “个人用户运营审核通过、个人账号激活后生效”；
- 个人用户注册的“提交后处理” → “待审核 → 运营审核通过 → 激活个人账号 → 初始化免费体验资格”；
- 通知表中“个人账号已开通，体验权益已到账”改为审核通过触发；
- AC04、AC11、AC12（若其文本涉及免审）改为审核通过前提。

文档标题和页脚版本从 V1.2 更新为 V1.3。

- [ ] **Step 4: 更新双模式计费方案和首页摘要**

在 `智能体双模式计费与新用户免费体验产品方案.html` 中统一替换：
- “个人用户免审开通后” → “个人用户运营审核通过、个人账号激活后”；
- 范围说明、适用条件、AC04、5.1 注册或审核通过结果页保持“审核通过后发放权益”的唯一口径。

将文档版本从 V1.0 更新为 V1.1。

在 `index.html` 的首页更新说明及“新用户注册与体验权益”卡片简介中删除“个人用户免审开通”口径，改为“个人与机构注册申请经审核通过后获得新用户免费体验权益”。

- [ ] **Step 5: 校验文档口径与 HTML 结构**

```bash
python3 - <<'PY'
from html.parser import HTMLParser
for path in [
    '用户注册流程图.html',
    '用户注册与机构类型设计方案.html',
    '智能体双模式计费与新用户免费体验产品方案.html',
    'index.html'
]:
    parser = HTMLParser(convert_charrefs=True)
    parser.feed(open(path, encoding='utf-8').read())
    parser.close()
    print(f'{path}: HTML parse OK')
PY
! rg -n '个人用户免审开通|个人用户无需审核|自动开通试用' \
  用户注册流程图.html 用户注册与机构类型设计方案.html \
  智能体双模式计费与新用户免费体验产品方案.html index.html
rg -n '运营审核通过|审核通过后' \
  用户注册流程图.html 用户注册与机构类型设计方案.html \
  智能体双模式计费与新用户免费体验产品方案.html index.html
```

Expected: 所有文件通过 HTML 解析；旧免审口径不存在；个人权益发放均与审核通过关联。

- [ ] **Step 6: 提交规则与文档口径改动**

```bash
git add 用户注册流程图.html 用户注册与机构类型设计方案.html \
  智能体双模式计费与新用户免费体验产品方案.html index.html
git commit -m "docs: align personal registration with review policy"
```

### Task 4: 全链路静态验收、部署与发布验证

**Files:**
- Modify: 无；使用前述任务修改的文件。

**Interfaces:**
- Consumes: Tasks 1–3 的用户端、运营端、流程图与方案改动。
- Produces: 可在 Cloudflare Pages 访问的统一审核原型及可追溯提交。

- [ ] **Step 1: 运行全量 HTML 结构校验**

```bash
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
for path in Path('.').rglob('*.html'):
    parser = HTMLParser(convert_charrefs=True)
    parser.feed(path.read_text(encoding='utf-8'))
    parser.close()
print('All HTML files parsed')
PY
git diff --check
```

Expected: 命令退出码为 0。

- [ ] **Step 2: 做规则口径的全站扫描**

```bash
! rg -n '个人用户免审开通|个人用户无需审核|个人用户注册后直接使用|自动开通试用' . --glob '*.html'
rg -n '个人账号审核已通过|个人账号申请正在审核中|个人实名申请|运营审核通过' \
  user admin 用户注册流程图.html 用户注册与机构类型设计方案.html \
  智能体双模式计费与新用户免费体验产品方案.html
```

Expected: 旧口径无命中；个人审核状态、运营条目和文档口径均有命中。

- [ ] **Step 3: 提交最后的校验修复（仅在前一步有未提交修复时）**

```bash
git status --short
git add -A
git commit -m "fix: complete personal registration review consistency"
```

Expected: 若工作区无变更，跳过提交；若因校验产生修复，提交只包含校验修复文件。

- [ ] **Step 4: 推送并验证 Cloudflare Pages 内容**

```bash
git push origin main
for i in 1 2 3 4 5; do
  sleep 15
  page=$(curl -Ls --max-time 20 'https://caiyi-platform-prototype.pages.dev/user/register-result.html?status=approved&type=individual')
  if printf '%s' "$page" | grep -q '个人账号审核已通过'; then
    echo "Deployment ready"
    break
  fi
  echo "Waiting for Cloudflare deployment"
done
curl -Ls -o /dev/null -w 'HTTP %{http_code}\n' \
  'https://caiyi-platform-prototype.pages.dev/user/register-result.html?status=approved&type=individual'
```

Expected: 页面包含“个人账号审核已通过”，最终 HTTP 状态为 200。
