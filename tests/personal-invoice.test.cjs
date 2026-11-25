const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const model = readFileSync(require('node:path').join(__dirname, '../user/bean-plan.js'), 'utf8');
const stateKey = 'caiyi.beanplan.v1';

function storage() {
  const data = new Map();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value)
  };
}

function createWorkspace(ws, localStorage = storage()) {
  const window = {};
  runInNewContext(model, {
    window, URLSearchParams, localStorage, sessionStorage: storage(),
    location: { search: '?ws=' + ws },
    document: { readyState: 'loading', addEventListener() {} }
  });
  return window.BeanPlan;
}

test('个人充值和消费按本人账本计费，单位订单无法提交', () => {
  const personal = createWorkspace('personal');
  const order = personal.invoiceableOrders()[0];
  const ids = Array.from(personal.invoiceableConsumptions(), row => row.flow.orderNo);
  assert.equal(personal.invoiceableOrders().length, 2);
  assert.throws(() => personal.submitInvoice('recharge', ['PK20260901102015'], { title: '张敏' }), /不可开票/);
  const recharge = personal.submitInvoice('recharge', [order.orderNo], { title: '张敏', taxNo: '' });
  const consumption = personal.submitInvoice('consumption', ids, { title: '个人自选企业', taxNo: '91440101MA5EXMPL3K' });
  assert.equal(recharge.amount, 100);
  assert.equal(recharge.title, '张敏');
  assert.equal(consumption.amount, 255);
  assert.equal(consumption.title, '个人自选企业');
  assert.equal(consumption.taxNo, '91440101MA5EXMPL3K');
  assert.equal(personal.invoiceableOrders().length, 1);
  assert.equal(personal.invoiceableConsumptions().length, 0);

  const plan = personal.createPlan('starter', '支付宝');
  assert.equal(personal.submitInvoice('recharge', [plan.orderNo], { title: '张敏' }).amount, 5980);
});

test('个人与单位各自提交开票并凭单号查询，不覆盖已存在的申请', () => {
  const shared = storage();
  const org = createWorkspace('org', shared);
  const personal = createWorkspace('personal', shared);
  const personalOrder = personal.invoiceableOrders()[0];
  const orgOrder = org.invoiceableOrders()[0];
  const orgInvoice = org.submitInvoice('recharge', [orgOrder.orderNo], { title: '示例科技有限公司' });
  const personalInvoice = personal.submitInvoice('recharge', [personalOrder.orderNo], { title: '张敏' });
  assert.notEqual(orgInvoice.id, personalInvoice.id);
  const updatedPersonal = createWorkspace('personal', shared);
  const updatedOrg = createWorkspace('org', shared);
  assert.equal(updatedOrg.findInvoice(orgInvoice.id).amount, orgOrder.paid);
  assert.equal(updatedPersonal.findInvoice(personalInvoice.id).amount, 100);
  assert.equal(updatedPersonal.findInvoice(orgInvoice.id), null);
  assert.equal(updatedOrg.findInvoice(personalInvoice.id), null);
});

test('重复选择、旧页面重复提交和保存失败均不会占用额外开票资格', () => {
  const shared = storage();
  const personal = createWorkspace('personal', shared);
  const stale = createWorkspace('personal', shared);
  const [first, second] = Array.from(personal.invoiceableConsumptions(), row => row.flow.orderNo);
  stale.invoiceableConsumptions();
  assert.throws(() => personal.submitInvoice('consumption', [first, first], { title: '张敏' }), /重复/);
  assert.equal(personal.invoiceableConsumptions().length, 3);
  personal.submitInvoice('consumption', [first], { title: '张敏' });
  assert.throws(() => stale.submitInvoice('consumption', [first], { title: '张敏' }), /不可开票/);
  const setItem = shared.setItem;
  shared.setItem = (key, value) => {
    if (key === stateKey) throw new Error('quota');
    setItem(key, value);
  };
  assert.throws(() => personal.submitInvoice('consumption', [second], { title: '张敏' }), /保存失败/);
  assert.equal(personal.invoiceableConsumptions().length, 2);
  assert.equal(personal.invoicesOf().length, 1);
});

test('旧支付页写入新订单时保留其他页面已提交的个人申请', () => {
  const shared = storage();
  const org = createWorkspace('org', shared);
  const personal = createWorkspace('personal', shared);
  org.invoiceableOrders();
  const order = personal.invoiceableOrders()[0];
  const invoice = personal.submitInvoice('recharge', [order.orderNo], { title: '张敏' });
  const orgOrder = org.createRecharge(500, '机构对公账户');
  const updatedPersonal = createWorkspace('personal', shared);
  assert.equal(updatedPersonal.findInvoice(invoice.id).amount, 100);
  assert.equal(updatedPersonal.invoiceableOrders().some(row => row.orderNo === order.orderNo), false);
  assert.equal(updatedPersonal.findOrder(orgOrder.orderNo), null);
  assert.equal(org.findOrder(orgOrder.orderNo).paid, 500);
});

test('企业抬头拒绝空白税号，申请保留两种收票方式', () => {
  const personal = createWorkspace('personal');
  const ids = [personal.invoiceableOrders()[0].orderNo];
  assert.throws(() => personal.submitInvoice('recharge', ids, {
    title: '个人自选企业', titleType: 'company', taxNo: '  '
  }), /纳税人识别号/);
  const invoice = personal.submitInvoice('recharge', ids, {
    title: '个人自选企业', titleType: 'company', taxNo: '91440101MA5EXMPL3K',
    receiptPhone: '13900000000', receiptEmail: 'invoice@example.com'
  });
  assert.equal(invoice.receiptPhone, '13900000000');
  assert.equal(invoice.receiptEmail, 'invoice@example.com');
});
