/**
 * 彩豆年包 / 单次充值 / 免费彩豆 原型共享模型
 * - 配置（运营端可改）：caiyi.beanplan.config.v1
 * - 账本（用户端两种身份）：caiyi.beanplan.v1
 * 原型使用固定业务日期，保证月度赠豆、登录赠豆与有效期演示稳定。
 */
(function () {
  'use strict';

  var STATE_KEY = 'caiyi.beanplan.v1';
  var CFG_KEY = 'caiyi.beanplan.config.v1';
  var WS_KEY = 'caiyi.beanplan.ws';
  var TODAY = '2026-11-18';
  var MAX_ON_SALE = 6; // 在售年包上限，保证用户端卡片可读
  // 2026-11-25：年包升级本期不做，入口与下单均关闭（测算与分摊代码保留，改为 true 可恢复）
  var UPGRADE_ENABLED = false;

  var DEFAULT_CFG = {
    plans: [
      { tier: 'starter', name: '入门版', price: 5980, ratio: 30, on: true },
      { tier: 'standard', name: '标准版', price: 30980, ratio: 40, on: true },
      { tier: 'pro', name: '专业版', price: 60980, ratio: 50, on: true }
    ],
    validityMonths: 12,
    small: [100, 500, 1000],
    customMin: 10,
    customMax: 10000,
    rechargeGift: { on: true, ratio: 100, start: '2026-11-15', end: '2026-12-31' }, // 限时充值赠送，档位与自定义金额统一比例
    monthly: { on: true, beans: 50 },
    login: { on: true, beans: 5, cap: 50 },
    history: [
      { time: '2026-11-10 10:00', item: '年包价格与赠送比例', before: '—', after: '入门版 ¥5,980 / 30% · 标准版 ¥30,980 / 40% · 专业版 ¥60,980 / 50%', by: '管理员' }
    ]
  };

  // ---------- 工具 ----------
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function fmt(n, dec) {
    if (dec === undefined) dec = 2;
    return Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtInt(n) { return fmt(n, 0); }
  function money(n, dec) { return '¥' + fmt(n, dec === undefined ? 2 : dec); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function nowTime() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function stamp() { return TODAY + ' ' + nowTime(); }
  function orderNo(prefix) { return prefix + TODAY.replace(/-/g, '') + nowTime().replace(/:/g, '') + Math.floor(Math.random() * 90 + 10); }
  function addMonths(dateStr, months) {
    var p = dateStr.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1 + months, p[2]);
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function daysBetween(a, b) {
    var pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((new Date(pb[0], pb[1] - 1, pb[2]) - new Date(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }
  function monthEnd(dateStr) {
    var p = dateStr.split('-').map(Number);
    var d = new Date(p[0], p[1], 0);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function param(k) { return new URLSearchParams(location.search).get(k); }

  // ---------- 配置 ----------
  function loadCfg() {
    try {
      var raw = localStorage.getItem(CFG_KEY);
      if (raw) {
        var c = JSON.parse(raw);
        if (c && Array.isArray(c.plans)) {
          if (!c.small || c.small.length !== 3) c.small = DEFAULT_CFG.small.slice(); // 兼容两档旧配置
          if (!c.rechargeGift) c.rechargeGift = clone(DEFAULT_CFG.rechargeGift); // 充值赠送为新增配置
          if (!c.monthly) c.monthly = clone(DEFAULT_CFG.monthly); // 月度赠豆恢复，兼容取消期间保存的配置
          return c;
        }
      }
    } catch (_) { /* 使用默认配置 */ }
    return clone(DEFAULT_CFG);
  }
  function saveCfg(cfg) {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }
  function planDef(tier, cfg) {
    cfg = cfg || loadCfg();
    for (var i = 0; i < cfg.plans.length; i++) if (cfg.plans[i].tier === tier) return planView(cfg.plans[i]);
    return null;
  }
  function planView(p) {
    var gift = Math.round(p.price * p.ratio / 100);
    return { tier: p.tier, name: p.name, price: p.price, ratio: p.ratio, on: p.on !== false, base: p.price, gift: gift, total: p.price + gift };
  }
  // 在售年包按价格升序；升级目标 = 价格更高的在售年包
  function salePlans(cfg) {
    cfg = cfg || loadCfg();
    return cfg.plans.filter(function (p) { return p.on !== false; }).map(planView).sort(function (a, b) { return a.price - b.price; });
  }
  function cheapestPlan(cfg) { return salePlans(cfg)[0] || null; }
  // 充值赠送活动状态：开关打开且业务日期在起止日期内才赠送
  function rechargePromo(cfg) {
    cfg = cfg || loadCfg();
    var g = cfg.rechargeGift || {};
    var state = !g.on ? 'off' : TODAY < g.start ? 'upcoming' : TODAY > g.end ? 'ended' : 'active';
    return { on: !!g.on, ratio: g.ratio || 0, start: g.start || '', end: g.end || '', state: state, active: state === 'active' && g.ratio > 0 };
  }
  function rechargeGiftOf(amount, cfg) {
    var p = rechargePromo(cfg);
    return p.active ? Math.round(amount * p.ratio / 100) : 0;
  }
  function maxRatio(cfg) { return salePlans(cfg).reduce(function (m, p) { return Math.max(m, p.ratio); }, 0); }

  // ---------- 种子数据 ----------
  function f(time, kind, o) {
    o = o || {};
    return {
      id: kind + '-' + time.replace(/\D/g, ''), time: time, kind: kind,
      title: o.title || '', who: o.who || '', orderNo: o.orderNo || '', channel: o.channel || '',
      planId: o.planId || '', note: o.note || '', meta: o.meta || null, gift: o.gift || 0, paid: o.paid || 0,
      parts: { free: o.free || 0, plan: o.plan || 0, recharge: o.recharge || 0 }
    };
  }
  // 消费元数据：计费方式 / 渠道 / 调用状态 / 开票状态（eligible 待开票 · pending 开票中 · done 已开票 · none 不可开票）
  function cm(billing, ch, invoice, status) { return { billing: billing, ch: ch, invoice: invoice, status: status || '成功' }; }
  var PHONE = { '张敏': '139****1234', '王晨': '136****5678', '李用户': '138****8888', '陈晓': '137****9012' };
  function seedOrg() {
    var P = 'PK20260901102015';
    return {
      flows: [
        f('2026-08-05 09:12:30', 'recharge', { who: '李用户', orderNo: 'RC20260805091230', channel: '机构对公账户', recharge: 500 }),
        f('2026-08-08 15:26:12', 'consume', { who: '李用户', title: '政府采购数据分析智能体', orderNo: 'USE20260808152612', recharge: -109.24, meta: cm('Token 计费', 'API', 'done') }),
        f('2026-08-12 09:42:06', 'consume', { who: '张敏', title: '智能体内容助手', orderNo: 'USE20260812094206', recharge: -30, meta: cm('按次计费', 'Web', 'eligible') }),
        f('2026-08-12 11:07:26', 'recharge', { who: '张敏', orderNo: 'RC20260812110726', channel: '微信支付（个人支付）', recharge: 100 }),
        f('2026-08-13 14:52:08', 'consume', { who: '王晨', title: '采购需求分析智能体', orderNo: 'USE20260813145208', recharge: -195.6, meta: cm('Token 计费', 'API', 'pending') }),
        f('2026-08-14 16:06:31', 'recharge', { who: '李用户', orderNo: 'RC20260814160631', channel: '机构对公账户', recharge: 1000 }),
        f('2026-08-15 11:05:31', 'consume', { who: '王晨', title: '合规监测智能体', orderNo: 'USE20260815110531', recharge: -80.15, meta: cm('Token 计费', 'Web', 'eligible') }),
        f('2026-08-16 10:22:05', 'consume', { who: '陈晓', title: '合规监测智能体', orderNo: 'USE20260816102205', meta: cm('Token 计费', 'Web', 'none', '失败') }),
        f('2026-08-18 14:36:21', 'consume', { who: '张敏', title: '采购需求分析智能体', orderNo: 'USE20260818143621', recharge: -10.4, meta: cm('Token 计费', 'Web', 'eligible') }),
        f('2026-09-01 10:20:15', 'plan', { who: '李用户', title: '入门版', orderNo: P, channel: '机构对公账户', planId: P, plan: 7774 }),
        f('2026-09-05 15:12:40', 'consume', { who: '王晨', title: '采购需求分析智能体', orderNo: 'USE20260905151240', planId: P, plan: -320, meta: cm('Token 计费', 'Web', 'done') }),
        f('2026-09-18 10:31:08', 'consume', { who: '张敏', title: '合规监测智能体', orderNo: 'USE20260918103108', planId: P, plan: -860, meta: cm('按次计费', 'Web', 'pending') }),
        f('2026-10-12 14:05:22', 'consume', { who: '李用户', title: '政府采购数据分析智能体', orderNo: 'USE20261012140522', planId: P, plan: -1045.6, meta: cm('Token 计费', 'API', 'eligible') }),
        f('2026-10-26 16:40:11', 'consume', { who: '王晨', title: '合规监测智能体', orderNo: 'USE20261026164011', planId: P, plan: -210.4, meta: cm('Token 计费', 'Web', 'eligible') }),
        f('2026-11-06 09:18:45', 'consume', { who: '张敏', title: '采购需求分析智能体', orderNo: 'USE20261106091845', planId: P, plan: -12, meta: cm('Token 计费', 'Web', 'eligible') })
      ],
      plans: [
        { id: P, tier: 'starter', name: '入门版', buyAt: '2026-09-01', expireAt: '2027-08-31', price: 5980, ratio: 30, paid: 5980, base: 5980, gift: 1794, total: 7774, upgrades: [] }
      ],
      orders: [
        { orderNo: P, time: '2026-09-01 10:20:15', who: '李用户', type: 'plan', title: '入门版年包', paid: 5980, base: 5980, gift: 1794, expireAt: '2027-08-31', channel: '机构对公账户', invoice: 'pending' },
        { orderNo: 'RC20260814160631', time: '2026-08-14 16:06:31', who: '李用户', type: 'recharge', title: '单次充值', paid: 1000, base: 1000, gift: 0, channel: '企业账户', invoice: 'pending' },
        { orderNo: 'RC20260812110726', time: '2026-08-12 11:07:26', who: '张敏', type: 'recharge', title: '单次充值', paid: 100, base: 100, gift: 0, channel: '微信支付（个人支付）', invoice: 'pending' },
        { orderNo: 'RC20260805091230', time: '2026-08-05 09:12:30', who: '李用户', type: 'recharge', title: '单次充值', paid: 500, base: 500, gift: 0, channel: '企业账户', invoice: 'processing' },
        { orderNo: 'RC20260728101502', time: '2026-07-28 10:15:02', who: '李用户', type: 'recharge', title: '单次充值', paid: 2000, base: 2000, gift: 0, channel: '企业账户', invoice: 'complete' },
        { orderNo: 'RC20260722143010', time: '2026-07-22 14:30:10', who: '张敏', type: 'recharge', title: '单次充值', paid: 500, base: 500, gift: 0, channel: '微信支付（个人支付）', invoice: 'complete' }
      ],
      base: 17525.39 // 2026-08-05 前的充值彩豆结余
    };
  }
  function seedPersonal() {
    var logins = [];
    ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-15', '2026-10-20', '2026-10-28',
      '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-07', '2026-11-10', '2026-11-12', '2026-11-17']
      .forEach(function (d, i) { logins.push(f(d + ' 0' + (8 + (i % 2)) + ':1' + (i % 6) + ':0' + (i % 9), 'login', { free: 5 })); });
    // 月度赠豆：当月首次登录时到账
    logins.push(f('2026-10-08 08:10:00', 'monthly', { title: '10 月', free: 50 }));
    logins.push(f('2026-11-03 08:10:06', 'monthly', { title: '11 月', free: 50 }));
    var flows = [
      f('2026-10-09 20:16:42', 'recharge', { who: '张敏', orderNo: 'RC20261009201642', channel: '微信支付', recharge: 100 }),
      f('2026-10-16 15:02:19', 'consume', { who: '张敏', title: '采购需求分析智能体', orderNo: 'USE20261016150219', free: -70, recharge: -40, meta: cm('Token 计费', 'Web', 'eligible') }),
      f('2026-10-31 23:59:59', 'expire', { title: '10 月免费彩豆', free: -10 }),
      f('2026-11-02 19:40:05', 'recharge', { who: '张敏', orderNo: 'RC20261102194005', channel: '支付宝', recharge: 100 }),
      f('2026-11-10 14:22:37', 'consume', { who: '张敏', title: '合规监测智能体', orderNo: 'USE20261110142237', free: -75, recharge: -3, meta: cm('Token 计费', 'Web', 'eligible') }),
      // 限时充值 1:1 赠送期间充值，随后一笔消费跨越无赠送与含赠送两个充值批次
      f('2026-11-16 10:05:12', 'recharge', { who: '张敏', orderNo: 'RC20261116100512', channel: '微信支付', recharge: 200, gift: 100, paid: 100 }),
      f('2026-11-17 14:30:26', 'consume', { who: '张敏', title: '政府采购数据分析智能体', orderNo: 'USE20261117143026', free: -10, recharge: -267,
        meta: cm('Token 计费', 'Web', 'eligible') })
    ].concat(logins);
    return {
      flows: flows,
      plans: [],
      orders: [
        { orderNo: 'RC20261116100512', time: '2026-11-16 10:05:12', who: '张敏', type: 'recharge', title: '单次充值', paid: 100, base: 100, gift: 100, channel: '微信支付', invoice: 'pending' },
        { orderNo: 'RC20261102194005', time: '2026-11-02 19:40:05', who: '张敏', type: 'recharge', title: '单次充值', paid: 100, base: 100, gift: 0, channel: '支付宝', invoice: 'pending' },
        { orderNo: 'RC20261009201642', time: '2026-10-09 20:16:42', who: '张敏', type: 'recharge', title: '单次充值', paid: 100, base: 100, gift: 0, channel: '微信支付', invoice: 'complete' }
      ],
      base: 0
    };
  }
  function seed() { return { version: 8, org: seedOrg(), personal: seedPersonal() }; }

  // ---------- 状态 ----------
  var memoryState = null;
  function loadState(refresh) {
    if (memoryState && !refresh) return memoryState;
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.version === 8 && s.org && s.personal) { memoryState = s; return s; } }
    } catch (_) { /* 重新初始化 */ }
    if (memoryState) return memoryState;
    memoryState = seed();
    saveState();
    return memoryState;
  }
  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(memoryState)); return true; }
    catch (_) { return false; }
  }
  function resetAll() {
    memoryState = seed();
    saveState();
    try { localStorage.removeItem(CFG_KEY); } catch (_) { /* ignore */ }
  }

  // ---------- 身份 ----------
  function getWs() {
    var q = param('ws');
    try {
      if (q === 'personal' || q === 'org') sessionStorage.setItem(WS_KEY, q);
      return sessionStorage.getItem(WS_KEY) || 'org';
    } catch (_) { return q === 'personal' ? 'personal' : 'org'; }
  }
  function acct(ws) { return loadState()[ws || getWs()]; }
  function isPersonal(ws) { return (ws || getWs()) === 'personal'; }
  function walletName(ws) { return isPersonal(ws) ? '个人彩豆' : '单位彩豆'; }

  // ---------- 账本计算 ----------
  function sortedFlows(a) {
    return a.flows.slice().sort(function (x, y) { return x.time < y.time ? -1 : x.time > y.time ? 1 : 0; });
  }
  function flowTotal(fl) { return round2(fl.parts.free + fl.parts.plan + fl.parts.recharge); }
  function planRemaining(a, planId) {
    var s = 0;
    a.flows.forEach(function (fl) { if (fl.planId === planId) s += fl.parts.plan; });
    return round2(s);
  }
  function buckets(ws) {
    var a = acct(ws);
    var b = { free: 0, plan: 0, recharge: a.base || 0 };
    a.flows.forEach(function (fl) { b.free += fl.parts.free; b.plan += fl.parts.plan; b.recharge += fl.parts.recharge; });
    b.free = round2(b.free); b.plan = round2(b.plan); b.recharge = round2(b.recharge);
    b.total = round2(b.free + b.plan + b.recharge);
    b.rechargeGift = a.flows.reduce(function (n, fl) { return n + (fl.kind === 'recharge' ? fl.gift || 0 : 0); }, 0);
    b.freeExpire = monthEnd(TODAY);
    var act = activePlans(ws);
    b.planExpire = act.length ? act.map(function (p) { return p.expireAt; }).sort()[0] : '';
    return b;
  }
  function isFailed(fl) { return !!(fl.meta && fl.meta.status === '失败'); }
  function ledger(ws, withFailed) {
    var a = acct(ws);
    var bal = a.base || 0;
    var rows = sortedFlows(a).map(function (fl) {
      var before = round2(bal);
      bal = round2(bal + flowTotal(fl));
      return { flow: fl, before: before, after: bal, delta: flowTotal(fl) };
    });
    rows = rows.reverse();
    return withFailed ? rows : rows.filter(function (r) { return !isFailed(r.flow); });
  }
  // ---------- 本金分摊（开票与开发者分账共用） ----------
  // 每份年包、每笔充值各为一个批次，记“未分摊实付（分）”与“未使用彩豆”。
  // 每笔消费的金额 = 消费彩豆 × 未分摊实付 ÷ 未使用彩豆，四舍五入到分后从未分摊实付中扣除；
  // 用完批次最后一笔取全部余额，故批次用完时合计恰好等于实付。升级把补差价与补发彩豆并入原批次。
  function cents(n) { return Math.round(n * 100); }
  function take(bt, x) {
    var amt = x >= bt.S - 1e-9 ? bt.R : Math.min(bt.R, Math.round(x * bt.R / bt.S));
    var line = { orderNo: bt.orderNo, label: bt.label, beans: round2(x), amount: amt / 100, remainPaid: bt.R / 100, remainBeans: round2(bt.S), gift: bt.gift, plan: bt.plan };
    bt.R -= amt; bt.S = round2(bt.S - x);
    return line;
  }
  function allocations(ws) {
    var a = acct(ws), plans = {}, pool = [], out = { lines: {}, cleared: [], plans: plans, pool: pool };
    if (a.base) pool.push({ orderNo: '', label: '历史充值', R: cents(a.base), S: a.base, gift: false });
    a.plans.forEach(function (p) {
      var up = (p.upgrades || []).reduce(function (o, u) { o.pay += u.pay; o.beans += u.beans; return o; }, { pay: 0, beans: 0 });
      plans[p.id] = { orderNo: p.id, label: '年包', name: p.name, R: 0, S: 0, initPaid: p.paid - up.pay, plan: true, gift: true, upgrades: p.upgrades || [] };
    });
    sortedFlows(a).forEach(function (fl) {
      var pb = fl.planId ? plans[fl.planId] : null;
      if (fl.kind === 'plan' && pb) { pb.R += cents(pb.initPaid); pb.S = round2(pb.S + fl.parts.plan); }
      else if (fl.kind === 'upgrade' && pb) {
        var u = pb.upgrades.filter(function (x) { return x.orderNo === fl.orderNo; })[0];
        pb.R += cents(u ? u.pay : 0); pb.S = round2(pb.S + fl.parts.plan);
      } else if (fl.kind === 'recharge') {
        var paid = fl.paid || fl.parts.recharge;
        pool.push({ orderNo: fl.orderNo, label: fl.gift ? '限时赠送充值' : '充值', R: cents(paid), S: fl.parts.recharge, gift: !!fl.gift });
      } else if (fl.kind === 'expire' && pb && fl.parts.plan) {
        out.cleared.push({ planId: fl.planId, beans: -fl.parts.plan, amount: pb.R / 100 }); pb.R = 0; pb.S = 0;
      } else if (fl.kind === 'consume' && !isFailed(fl)) {
        var lines = [];
        var xp = -(fl.parts.plan || 0);
        if (xp && pb && pb.S > 0) { var l = take(pb, Math.min(xp, pb.S)); l.label = (pb.name || '') + '年包'; lines.push(l); }
        var xr = round2(-(fl.parts.recharge || 0));
        for (var i = 0; i < pool.length && xr > 0; i++) {
          if (pool[i].S <= 0) continue;
          var t = Math.min(xr, pool[i].S);
          lines.push(take(pool[i], t)); xr = round2(xr - t);
        }
        out.lines[fl.orderNo] = lines;
      }
    });
    return out;
  }
  // 可开票明细：无赠送的充值批次合并为一行，年包与含赠送批次逐批展示
  function invoiceLines(fl) {
    if (fl.kind !== 'consume' || isFailed(fl)) return [];
    var lines = allocations().lines[fl.orderNo] || [], plain = null, out = [];
    lines.forEach(function (l) {
      if (!l.plan && !l.gift) {
        if (!plain) { plain = { label: '无赠送充值', beans: 0, amount: 0, plain: true }; out.push(plain); }
        plain.beans = round2(plain.beans + l.beans); plain.amount = round2(plain.amount + l.amount);
      } else out.push(l);
    });
    return out;
  }
  function invoiceBase(fl) {
    return round2(invoiceLines(fl).reduce(function (n, x) { return n + x.amount; }, 0));
  }
  function consumptions(ws) {
    return ledger(ws, true).filter(function (r) { return r.flow.kind === 'consume'; });
  }
  function monthStats(ws) {
    var a = acct(ws), m = TODAY.slice(0, 7), s = { income: 0, consume: 0, calls: 0, members: {}, free: 0, login: 0, loginDays: 0, monthly: 0 };
    a.flows.forEach(function (fl) {
      if (fl.time.slice(0, 7) !== m) return;
      var t = flowTotal(fl);
      if (fl.kind === 'consume') { if (isFailed(fl)) return; s.consume += -t; s.calls++; if (fl.who) s.members[fl.who] = 1; }
      else if (fl.kind !== 'expire') s.income += t;
      if (fl.kind === 'monthly' || fl.kind === 'login') s.free += t;
      if (fl.kind === 'login') { s.login += t; s.loginDays++; }
      if (fl.kind === 'monthly') s.monthly += t;
    });
    s.income = round2(s.income); s.consume = round2(s.consume); s.memberCount = Object.keys(s.members).length;
    return s;
  }
  function activePlans(ws) {
    var a = acct(ws);
    return a.plans.filter(function (p) { return p.expireAt >= TODAY; }).map(function (p) {
      var r = planRemaining(a, p.id);
      return Object.assign({}, p, { remaining: r, used: round2(p.total - r), daysLeft: daysBetween(TODAY, p.expireAt) });
    });
  }
  function currentPlan(ws) {
    var list = activePlans(ws);
    if (!list.length) return null;
    return list.sort(function (x, y) { return x.buyAt < y.buyAt ? 1 : -1; })[0];
  }
  function loginToday(ws) {
    var a = acct(ws);
    return a.flows.some(function (fl) { return fl.kind === 'login' && fl.time.slice(0, 10) === TODAY; });
  }

  // ---------- 升级测算 ----------
  function calcUpgrade(plan, toTier, cfg) {
    if (!UPGRADE_ENABLED) return { ok: false, reason: '年包升级暂未开放' };
    var target = planDef(toTier, cfg);
    if (!plan || !target) return { ok: false, reason: '年包信息不存在' };
    if (plan.expireAt < TODAY) return { ok: false, reason: '原年包已到期，不可升级' };
    if (!target.on) return { ok: false, reason: '目标年包已停售' };
    if (target.tier === plan.tier || target.price <= plan.price) return { ok: false, reason: '仅支持升级到价格更高的年包' };
    var pay = round2(target.price - plan.paid);
    var beans = Math.round(target.total - plan.total);
    if (pay <= 0 || beans <= 0) return { ok: false, reason: '当前价格配置下不可升级，请联系平台' };
    var giftAdd = beans - pay;
    var giftOnNew = Math.round(pay * target.ratio / 100);
    return {
      ok: true, from: plan, to: target, pay: pay, beans: beans, baseAdd: pay, giftAdd: giftAdd,
      giftOnNew: giftOnNew, giftCatchup: giftAdd - giftOnNew,
      remainingAfter: round2((plan.remaining || 0) + beans),
      expireAt: plan.expireAt, daysLeft: daysBetween(TODAY, plan.expireAt)
    };
  }

  function upgradeTargets(plan, cfg) {
    if (!plan || !UPGRADE_ENABLED) return [];
    return salePlans(cfg).map(function (p) { return calcUpgrade(plan, p.tier, cfg); }).filter(function (c) { return c.ok; });
  }

  // ---------- 下单（模拟支付成功） ----------
  function who(ws) { return isPersonal(ws) ? '张敏' : '李用户'; }
  function createRecharge(amount, channel) {
    var ws = getWs(), a = loadState(true)[ws], no = orderNo('RC'), t = stamp(), gift = rechargeGiftOf(amount);
    a.flows.push(f(t, 'recharge', { who: who(ws), orderNo: no, channel: channel, recharge: amount + gift, gift: gift, paid: amount }));
    var o = { orderNo: no, time: t, who: who(ws), type: 'recharge', title: '单次充值', paid: amount, base: amount, gift: gift, channel: channel, invoice: 'pending' };
    a.orders.unshift(o);
    return saveState() ? o : null;
  }
  function createPlan(tier, channel) {
    var ws = getWs(), a = loadState(true)[ws], def = planDef(tier), no = orderNo('PK'), t = stamp(), cfg = loadCfg();
    if (!def || !def.on) return null;
    var plan = { id: no, tier: tier, name: def.name, buyAt: TODAY, expireAt: addMonths(TODAY, cfg.validityMonths), price: def.price, ratio: def.ratio, paid: def.price, base: def.base, gift: def.gift, total: def.total, upgrades: [] };
    a.plans.push(plan);
    a.flows.push(f(t, 'plan', { who: who(ws), title: def.name, orderNo: no, channel: channel, planId: no, plan: def.total }));
    var o = { orderNo: no, time: t, who: who(ws), type: 'plan', title: def.name + '年包', paid: def.price, base: def.base, gift: def.gift, expireAt: plan.expireAt, channel: channel, invoice: 'pending' };
    a.orders.unshift(o);
    return saveState() ? o : null;
  }
  function createUpgrade(planId, toTier, channel) {
    var ws = getWs(), a = loadState(true)[ws];
    var plan = activePlans(ws).filter(function (p) { return p.id === planId; })[0];
    var c = calcUpgrade(plan, toTier);
    if (!c.ok) return null;
    var no = orderNo('PU'), t = stamp();
    var stored = a.plans.filter(function (p) { return p.id === planId; })[0];
    stored.upgrades.push({ orderNo: no, time: t, from: stored.tier, to: toTier, pay: c.pay, beans: c.beans });
    stored.tier = toTier; stored.name = c.to.name; stored.price = c.to.price; stored.ratio = c.to.ratio;
    stored.paid = round2(stored.paid + c.pay); stored.base = round2(stored.base + c.baseAdd);
    stored.gift = stored.gift + c.giftAdd; stored.total = stored.total + c.beans;
    a.flows.push(f(t, 'upgrade', { who: who(ws), title: c.from.name + ' → ' + c.to.name, orderNo: no, channel: channel, planId: planId, plan: c.beans }));
    var o = { orderNo: no, time: t, who: who(ws), type: 'upgrade', title: c.from.name + '升级' + c.to.name, paid: c.pay, base: c.baseAdd, gift: c.giftAdd, expireAt: stored.expireAt, channel: channel, invoice: 'pending', planId: planId };
    a.orders.unshift(o);
    return saveState() ? o : null;
  }
  // ---------- 开票 ----------
  function invoicesOf(ws) { var a = acct(ws); a.invoices = a.invoices || []; return a.invoices; }
  function invoiceableOrders(ws) {
    return acct(ws).orders.filter(function (o) { return o.invoice === 'pending'; }).sort(function (x, y) { return x.time < y.time ? 1 : -1; });
  }
  function invoiceableConsumptions(ws) {
    return consumptions(ws).filter(function (r) { return r.flow.meta && r.flow.meta.invoice === 'eligible' && invoiceBase(r.flow) > 0; });
  }
  // 提交开票申请：先整体校验，再统一占用资格；充值/年包订单按实付金额，消费按年包与充值彩豆折算金额
  function submitInvoice(kind, ids, details) {
    if (kind !== 'recharge' && kind !== 'consumption') throw new Error('开票来源无效');
    if (!ids || !ids.length) throw new Error('请至少选择一条记录');
    if (new Set(ids).size !== ids.length) throw new Error('请勿重复选择同一条记录');
    var title = (details.title || '').trim();
    var taxNo = (details.taxNo || '').trim();
    if (!title) throw new Error('请填写发票抬头');
    if (details.titleType === 'company' && !taxNo) throw new Error('请填写企业抬头的纳税人识别号');

    // 重新读取账本，避免旧页面覆盖其他页面已提交的申请。
    var ws = getWs(), a = loadState(true)[ws], amount = 0, targets = [];
    ids.forEach(function (id) {
      if (kind === 'recharge') {
        var o = a.orders.filter(function (x) { return x.orderNo === id; })[0];
        if (!o || o.invoice !== 'pending') throw new Error('订单 ' + id + ' 当前不可开票，请刷新后重试');
        amount += o.paid; targets.push(o);
      } else {
        var fl = a.flows.filter(function (x) { return x.kind === 'consume' && x.orderNo === id; })[0];
        if (!fl || !fl.meta || fl.meta.invoice !== 'eligible' || invoiceBase(fl) <= 0) throw new Error('消费单 ' + id + ' 当前不可开票，请刷新后重试');
        amount += invoiceBase(fl); targets.push(fl);
      }
    });
    var original = clone(loadState());
    var taken = (original.org.invoices || []).concat(original.personal.invoices || []);
    var prefix = 'FP' + TODAY.replace(/-/g, ''), seq = taken.length + 1, no;
    do {
      no = prefix + String(seq++).padStart(3, '0');
    } while (taken.some(function (item) { return item.id === no; }));
    var req = {
      id: no, kind: kind, amount: round2(amount), title: title, taxNo: taxNo,
      receiptPhone: details.receiptPhone || '', receiptEmail: details.receiptEmail || '',
      time: stamp().slice(0, 16), status: 'pending', ids: ids.slice()
    };
    // 校验完成后一次性提交申请与资格状态，保存失败时恢复原账本。
    targets.forEach(function (t) { if (kind === 'recharge') t.invoice = 'processing'; else t.meta.invoice = 'pending'; });
    invoicesOf(ws).unshift(req);
    if (!saveState()) {
      memoryState = original;
      throw new Error('开票申请保存失败，请重试');
    }
    return req;
  }
  function findInvoice(id) {
    return invoicesOf().find(function (r) { return r.id === id; }) || null;
  }
  function monthlyGranted(ws) {
    var m = TODAY.slice(0, 7);
    return acct(ws).flows.some(function (fl) { return fl.kind === 'monthly' && fl.time.slice(0, 7) === m; });
  }
  // 个人身份进入页面时发放：当月首次登录发月度赠豆，当天首次登录发登录赠豆
  function claimLogin() {
    var ws = getWs();
    if (!isPersonal(ws)) return null;
    loadState(true);
    var cfg = loadCfg(), out = { beans: 0, monthly: 0, login: 0, cap: cfg.login.cap };
    if (cfg.monthly && cfg.monthly.on && cfg.monthly.beans > 0 && !monthlyGranted(ws)) {
      acct(ws).flows.push(f(stamp(), 'monthly', { title: Number(TODAY.slice(5, 7)) + ' 月', free: cfg.monthly.beans }));
      out.monthly = cfg.monthly.beans;
    }
    if (cfg.login.on && !loginToday(ws)) {
      var s = monthStats(ws);
      var give = Math.min(cfg.login.beans, cfg.login.cap - s.login);
      if (give > 0) { acct(ws).flows.push(f(stamp(), 'login', { free: give })); out.login = give; }
      else out.capped = true;
    }
    out.beans = out.monthly + out.login;
    if (!out.beans) return out.capped ? out : null;
    if (!saveState()) return null;
    out.month = monthStats(ws).login;
    return out;
  }
  // 已产生订单的年包（含升级目标），运营端只能停售不能删除
  function soldTiers() {
    var s = loadState(), set = {};
    ['org', 'personal'].forEach(function (k) {
      s[k].plans.forEach(function (p) { set[p.tier] = 1; (p.upgrades || []).forEach(function (u) { set[u.from] = 1; set[u.to] = 1; }); });
    });
    return set;
  }
  function findOrder(no) {
    return acct().orders.find(function (o) { return o.orderNo === no; }) || null;
  }

  // ---------- 通用 UI ----------
  var KIND = {
    recharge: { icon: '充', cls: 'in', label: '单次充值' },
    plan: { icon: '包', cls: 'plan', label: '年包购买' },
    upgrade: { icon: '升', cls: 'plan', label: '年包升级' },
    monthly: { icon: '赠', cls: 'gift', label: '月度赠豆' },
    login: { icon: '赠', cls: 'gift', label: '登录赠豆' },
    consume: { icon: '消', cls: 'out', label: '智能体消费' },
    expire: { icon: '期', cls: 'exp', label: '到期清零' }
  };
  var PART_LABEL = { free: '免费彩豆', plan: '年包彩豆', recharge: '充值彩豆' };
  function flowTitle(fl) {
    switch (fl.kind) {
      case 'recharge': return '单次充值 · ' + fl.who;
      case 'plan': return '购买' + fl.title + '年包 · ' + fl.who;
      case 'upgrade': return '年包升级 ' + fl.title + ' · ' + fl.who;
      case 'monthly': return '月度赠豆' + (fl.title ? ' · ' + fl.title : '');
      case 'login': return '每日登录赠豆';
      case 'expire': return fl.title + '到期清零';
      default: return fl.who + ' · ' + fl.title;
    }
  }
  function partsText(fl) {
    var out = [];
    ['free', 'plan', 'recharge'].forEach(function (k) {
      var v = fl.parts[k];
      if (v) out.push(PART_LABEL[k] + ' ' + (v > 0 ? '+' : '−') + fmt(Math.abs(v)));
    });
    return out.join(' · ');
  }

  function toast(html, tone) {
    var el = document.createElement('div');
    el.className = 'bp-toast' + (tone ? ' ' + tone : '');
    el.setAttribute('role', 'status');
    el.innerHTML = html;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 4200);
  }

  function rulesHtml() {
    var cfg = loadCfg(), personal = isPersonal();
    var sale = salePlans(cfg);
    var rows = sale.map(function (v) {
      return '<tr><td>' + esc(v.name) + '</td><td>' + money(v.price, 0) + '</td><td>' + fmtInt(v.total) + '</td><td>赠送 ' + v.ratio + '%</td></tr>';
    }).join('');
    return '' +
      '<section><h4>兑换</h4><p>1 元 = 1 彩豆，彩豆可用于平台全部智能体。</p></section>' +
      (sale.length ? '<section><h4>年包</h4><table class="bp-mini-table"><thead><tr><th>年包</th><th>价格 / 年</th><th>年度总彩豆</th><th>额度权益</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p>自购买日起 ' + cfg.validityMonths + ' 个月有效，基础及赠送彩豆按同一有效期管理，到期未使用部分清零。可重复购买，每份年包单独计算有效期。</p></section>' +
      (UPGRADE_ENABLED ? '<section><h4>年包升级</h4><p>生效中的年包可升级到价格更高的在售年包，补差价 = 目标年包价格 − 原年包已付金额；补发彩豆 = 目标年包总彩豆 − 原年包总彩豆。升级后有效期不变，不支持降级。</p></section>' : '') : '') +
      '<section><h4>单次充值</h4><p>' + cfg.small.map(function (x) { return x + ' 元'; }).join(' / ') + ' 或自定义金额（' + cfg.customMin + '–' + fmtInt(cfg.customMax) + ' 元），长期有效。' + rechargeGiftText(cfg) + '</p></section>' +
      (personal && (cfg.login.on || (cfg.monthly && cfg.monthly.on)) ? '<section><h4>免费彩豆</h4><p>' + freeRuleText(cfg) + '当月有效，月底未使用部分清零；可用于全部智能体，年包用户同样享有。</p></section>' : '') +
      '<section><h4>扣减顺序</h4><p>' + (personal ? '免费彩豆 → ' : '') + '年包彩豆（先到期先用）→ 充值彩豆。</p></section>' +
      '<section><h4>开票</h4><p>年包和单次充值按实付金额开票；赠送彩豆' + (personal ? '和免费彩豆' : '') + '不开票。消费年包彩豆或充值彩豆可开消费发票，金额按对应年包或充值订单的未分摊实付 ÷ 未使用彩豆折算，用完时合计等于实付。</p></section>';
  }
  function rechargeGiftText(cfg) {
    var p = rechargePromo(cfg);
    if (p.active) return '限时活动（' + p.start + ' 至 ' + p.end + '）：档位与自定义金额均按充值金额的 ' + p.ratio + '% 赠送彩豆，赠送彩豆同样长期有效，不开票。';
    if (p.state === 'upcoming') return '充值赠送活动将于 ' + p.start + ' 开始，当前不赠送。';
    return '当前不赠送。';
  }
  function freeRuleText(cfg) {
    var t = '';
    if (cfg.monthly && cfg.monthly.on) t += '每月赠送 ' + cfg.monthly.beans + ' 彩豆，当月首次登录到账。';
    if (cfg.login.on) t += '每日首次登录赠送 ' + cfg.login.beans + ' 彩豆，每月最多 ' + cfg.login.cap + ' 彩豆。';
    return t;
  }
  function openRules() {
    var old = document.getElementById('bpRules');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'bpRules';
    wrap.className = 'bp-modal';
    wrap.innerHTML = '<div class="bp-modal-mask" data-close></div><div class="bp-modal-card" role="dialog" aria-modal="true" aria-labelledby="bpRulesTitle">' +
      '<div class="bp-modal-head"><h3 id="bpRulesTitle">彩豆规则</h3><button type="button" class="bp-modal-x" aria-label="关闭" data-close>×</button></div>' +
      '<div class="bp-modal-body">' + rulesHtml() + '</div></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) wrap.remove(); });
    document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { wrap.remove(); document.removeEventListener('keydown', onKey); } });
    var x = wrap.querySelector('.bp-modal-x'); if (x) x.focus();
  }

  // 顶栏身份切换：企业身份 / 个人身份 / 开发者
  function renderTopbar() {
    var right = document.querySelector('.top-bar.user .top-bar-right');
    if (!right) return;
    var old = right.querySelector('.id-switcher, .top-bar-user');
    var personal = isPersonal();
    var sw = document.createElement('div');
    sw.className = 'id-switcher';
    sw.id = 'idSwitcher';
    var item = function (ws, org, type, current) {
      return '<a class="id-menu-item' + (current ? ' current' : '') + '" href="' + (ws ? 'index.html?ws=' + ws : '../developer/index.html') + '">' +
        '<div class="id-dot ' + (current ? 'active' : 'idle') + '"></div><div class="id-item-body"><div class="id-item-org">' + org + '</div><div class="id-item-type">' + type + '</div></div>' +
        (current ? '<span class="id-item-tag current-tag">当前</span>' : '') + '</a>';
    };
    sw.innerHTML = '<div class="id-trigger" tabindex="0" role="button" aria-haspopup="true"><div class="id-avatar">张</div><div class="id-info"><span class="id-org">' +
      (personal ? '张敏' : '示例科技有限公司') + '</span><span class="id-type-badge">' + (personal ? '个人用户' : '采购单位') + '</span></div><span class="id-chevron">▾</span></div>' +
      '<div class="id-menu"><div class="id-menu-hd">切换工作台身份</div>' +
      item('org', '示例科技有限公司', '采购单位', !personal) +
      item('personal', '张敏', '个人用户', personal) +
      item('', '示例科技有限公司', '开发者', false) +
      '<div class="id-menu-sep"></div><a class="id-menu-action" href="register-select.html">＋ 注册新机构类型</a><a class="id-menu-action" href="login.html">退出登录</a></div>';
    if (old) old.replaceWith(sw); else right.appendChild(sw);
    var trig = sw.querySelector('.id-trigger');
    var toggle = function (e) { e.stopPropagation(); sw.classList.toggle('open'); };
    trig.addEventListener('click', toggle);
    trig.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
    document.addEventListener('click', function (e) { if (!sw.contains(e.target)) sw.classList.remove('open'); });
  }

  function applyPersonalSidebar() {
    if (!isPersonal()) return;
    var sidebar = document.querySelector('.sidebar.user');
    if (!sidebar) return;
    ['member-list.html', 'role-list.html'].forEach(function (href) {
      sidebar.querySelectorAll('a[href="' + href + '"]').forEach(function (a) { a.style.display = 'none'; });
    });
  }

  function init() {
    if (param('bpreset') === '1') {
      resetAll();
      var u = new URL(location.href); u.searchParams.delete('bpreset');
      history.replaceState(null, '', u.toString());
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-bp-rules]');
      if (t) { e.preventDefault(); openRules(); }
    });
    if (!document.querySelector('.sidebar.user')) return;
    // 由浏览器后退缓存恢复时，重新读取当前身份和账本。
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) location.reload();
    });
    getWs();
    renderTopbar();
    applyPersonalSidebar();
    if (isPersonal()) {
      var r = claimLogin();
      if (r && r.beans) {
        var head = r.monthly && r.login ? '本月赠送 ' + r.monthly + ' 彩豆 + 今日登录赠送 ' + r.login + ' 彩豆' : r.monthly ? '本月赠送 ' + r.monthly + ' 彩豆已到账' : '今日登录赠送 ' + r.login + ' 彩豆';
        toast('<span class="bp-toast-coin">+' + r.beans + '</span><span><b>' + head + '</b><small>本月登录赠豆 ' + r.month + ' / ' + r.cap + '，当月有效</small></span>');
        document.dispatchEvent(new CustomEvent('beanplan:change'));
      }
    }
  }

  window.BeanPlan = {
    TODAY: TODAY, MAX_ON_SALE: MAX_ON_SALE, UPGRADE_ENABLED: UPGRADE_ENABLED, KIND: KIND, PART_LABEL: PART_LABEL,
    fmt: fmt, fmtInt: fmtInt, money: money, esc: esc, param: param, daysBetween: daysBetween,
    loadCfg: loadCfg, saveCfg: saveCfg, defaultCfg: function () { return clone(DEFAULT_CFG); }, planDef: planDef, planView: planView, salePlans: salePlans, cheapestPlan: cheapestPlan, maxRatio: maxRatio, upgradeTargets: upgradeTargets, soldTiers: soldTiers,
    getWs: getWs, isPersonal: isPersonal, walletName: walletName, acct: acct,
    buckets: buckets, ledger: ledger, consumptions: consumptions, invoiceBase: invoiceBase, invoiceLines: invoiceLines, allocations: allocations, isFailed: isFailed, PHONE: PHONE, SOURCE_LABEL: { free: '免费彩豆', plan: '年包彩豆', recharge: '充值彩豆' }, monthStats: monthStats, activePlans: activePlans, currentPlan: currentPlan,
    calcUpgrade: calcUpgrade, createRecharge: createRecharge, createPlan: createPlan, createUpgrade: createUpgrade,
    freeRuleText: freeRuleText, rechargePromo: rechargePromo, rechargeGiftOf: rechargeGiftOf, rechargeGiftText: rechargeGiftText, findOrder: findOrder, invoicesOf: invoicesOf, invoiceableOrders: invoiceableOrders, invoiceableConsumptions: invoiceableConsumptions, submitInvoice: submitInvoice, findInvoice: findInvoice, flowTitle: flowTitle, partsText: partsText, toast: toast, openRules: openRules, resetAll: resetAll
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
