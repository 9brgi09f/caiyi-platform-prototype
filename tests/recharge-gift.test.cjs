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

test('消费含充值赠送彩豆时，可开票金额按实付 ÷ 到账彩豆折算', () => {
  const B = workspace('org');
  const fl = { kind: 'consume', parts: { free: 0, plan: 0, recharge: -110 }, meta: { status: '成功', rcoef: 0.5 } };
  assert.equal(B.invoiceBase(fl), 55);
  const plain = { kind: 'consume', parts: { free: 0, plan: 0, recharge: -110 }, meta: { status: '成功' } };
  assert.equal(B.invoiceBase(plain), 110);
});

test('演示数据：一笔消费跨无赠送与 1:1 赠送两个充值批次，可开票 157 + 55 = 212 元', () => {
  const B = workspace('personal');
  const row = B.invoiceableConsumptions().find(r => r.flow.orderNo === 'USE20261117143026');
  assert.equal(-row.delta, 277);
  assert.equal(JSON.stringify(B.rechargeBatches(row.flow).map(x => x.amount)), "[157,55]");
  assert.equal(B.invoiceBase(row.flow), 212);
  const order = B.invoiceableOrders().find(o => o.orderNo === 'RC20261116100512');
  assert.equal(order.paid, 100);
  assert.equal(order.gift, 100);
  assert.equal(B.submitInvoice('consumption', ['USE20261117143026'], { title: '张敏' }).amount, 212);
});
