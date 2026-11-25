const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const model = readFileSync(require('node:path').join(__dirname, '../user/bean-plan.js'), 'utf8');
const CFG_KEY = 'caiyi.beanplan.config.v1';

function storage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
}
function workspace(ws, localStorage = storage()) {
  const window = {};
  runInNewContext(model, {
    window, URLSearchParams, localStorage, sessionStorage: storage(),
    location: { search: '?ws=' + ws }, document: { readyState: 'loading', addEventListener() {} }
  });
  return window.BeanPlan;
}

test('活动期内档位与自定义金额都按比例赠送，赠送不计入开票金额', () => {
  const B = workspace('org');
  assert.equal(B.rechargePromo().active, true);
  assert.equal(B.rechargeGiftOf(500), 500);
  assert.equal(B.rechargeGiftOf(800), 800);
  const before = B.buckets().recharge;
  const order = B.createRecharge(500, '机构对公账户');
  assert.equal(order.paid, 500);
  assert.equal(order.gift, 500);
  assert.equal(B.buckets().recharge - before, 1000);
  const inv = B.submitInvoice('recharge', [order.orderNo], { title: '示例科技有限公司', titleType: 'company', taxNo: '91440000000000000X' });
  assert.equal(inv.amount, 500);
});

test('活动未开始、已结束或关闭时不赠送', () => {
  for (const g of [
    { on: true, ratio: 100, start: '2026-12-01', end: '2026-12-31' },
    { on: true, ratio: 100, start: '2026-10-01', end: '2026-11-01' },
    { on: false, ratio: 100, start: '2026-11-01', end: '2026-12-31' }
  ]) {
    const ls = storage();
    const B = workspace('personal', ls);
    const cfg = B.loadCfg(); cfg.rechargeGift = g; B.saveCfg(cfg);
    assert.equal(B.rechargeGiftOf(1000), 0);
    assert.equal(B.createRecharge(1000, '微信支付').gift, 0);
  }
});

test('旧配置缺少充值赠送时补默认值', () => {
  const ls = storage();
  ls.setItem(CFG_KEY, JSON.stringify({ plans: [], small: [100, 500, 1000], login: { on: true, beans: 5, cap: 50 } }));
  const B = workspace('org', ls);
  assert.deepEqual(JSON.parse(JSON.stringify(B.loadCfg().rechargeGift)), { on: true, ratio: 100, start: '2026-11-15', end: '2026-12-31' });
});

function consume(B, no, time, parts, planId) {
  B.acct().flows.push({ id: no, time, kind: 'consume', title: '测试智能体', who: '测试', orderNo: no, planId: planId || '',
    parts: Object.assign({ free: 0, plan: 0, recharge: 0 }, parts), meta: { billing: 'Token 计费', ch: 'Web', invoice: 'eligible', status: '成功' } });
}
function planTotal(B, planId) {
  const al = B.allocations();
  return Object.values(al.lines).flat().filter(l => l.plan && l.orderNo === planId).reduce((n, l) => n + Math.round(l.amount * 100), 0) / 100;
}

test('大量小额消费不累积尾差：入门版逐笔 1 彩豆用完，合计正好等于实付 5,980 元', () => {
  const B = workspace('personal');
  const plan = B.createPlan('starter', '微信支付');
  for (let i = 0; i < 7774; i++) consume(B, 'T' + i, '2026-11-19 ' + String(10000 + i), { plan: -1 }, plan.orderNo);
  assert.equal(planTotal(B, plan.orderNo), 5980);
  const amounts = new Set(Object.entries(B.allocations().lines).filter(([k]) => k.startsWith('T')).map(([, l]) => l[0].amount));
  assert.ok([...amounts].every(v => v === 0.76 || v === 0.77));
});

test('年包升级本期不开放：无升级目标，下单被拒且账本不变', () => {
  const B = workspace('org');
  const plan = B.currentPlan();
  assert.equal(B.UPGRADE_ENABLED, false);
  assert.equal(B.upgradeTargets(plan).length, 0);
  const before = B.buckets().total;
  assert.equal(B.createUpgrade(plan.id, 'standard', '机构对公账户'), null);
  assert.equal(B.buckets().total, before);
  assert.equal(planTotal(B, plan.id), 1883.08); // 已消费 2,448 彩豆的分摊合计
});

test('赠送充值批次用完时合计等于实付，跨批次按到账先后扣减', () => {
  const B = workspace('personal'); // 现有充值余额 90 来自 11-16 赠送批次（未分摊 45 元）
  const o = B.createRecharge(30, '微信支付'); // 限时 1:1，到账 60
  consume(B, 'USE-G-1', '2026-11-19 09:00:00', { recharge: -100 });
  consume(B, 'USE-G-2', '2026-11-20 09:00:00', { recharge: -50 });
  const l = B.allocations().lines;
  assert.equal(JSON.stringify(l['USE-G-1'].map(x => x.amount)), '[45,5]');
  assert.equal(l['USE-G-2'][0].orderNo, o.orderNo);
  assert.equal(l['USE-G-1'][1].amount + l['USE-G-2'][0].amount, 30);
  assert.equal(l['USE-G-2'][0].amount, 25);
});

test('演示数据：一笔消费跨无赠送与 1:1 赠送两个充值批次，可开票 157 + 55 = 212 元', () => {
  const B = workspace('personal');
  const row = B.invoiceableConsumptions().find(r => r.flow.orderNo === 'USE20261117143026');
  assert.equal(-row.delta, 277);
  assert.equal(JSON.stringify(B.invoiceLines(row.flow).map(x => x.amount)), "[157,55]");
  assert.equal(B.invoiceBase(row.flow), 212);
  const order = B.invoiceableOrders().find(o => o.orderNo === 'RC20261116100512');
  assert.equal(order.paid, 100);
  assert.equal(order.gift, 100);
  assert.equal(B.submitInvoice('consumption', ['USE20261117143026'], { title: '张敏' }).amount, 212);
});

test('年包彩豆消费可开消费发票，按本金分摊金额开票', () => {
  const B = workspace('org');
  const row = B.invoiceableConsumptions().find(r => r.flow.orderNo === 'USE20261012140522');
  assert.equal(B.invoiceBase(row.flow), 804.31); // 1,045.6 × 5,980 ÷ 7,774
  const total = B.invoiceableConsumptions().reduce((n, r) => n + B.invoiceBase(r.flow), 0);
  assert.equal(Math.round(total * 100) / 100, 1095.94);
  const inv = B.submitInvoice('consumption', ['USE20261012140522', 'USE20260815110531'], { title: '示例科技有限公司', titleType: 'company', taxNo: '91440000000000000X' });
  assert.equal(inv.amount, 884.46);
});
