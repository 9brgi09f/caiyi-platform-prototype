(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CaiyiRefund=api;})(globalThis,function(){
 'use strict';
 const KEY='caiyi.refund.v2';
 const permissionTargets={owner:'企业用户端 · 单位主账号',member:'企业用户端 · 单位子账号',developer:'开发者端 · 开发者账号',admin:'平台运营端 · 管理员'};
 const defaultPermissions=()=>({owner:false,member:false,developer:false,admin:false});
 const hasMenuPermission=(s,actor)=>Object.hasOwn(permissionTargets,actor)&&s.menuPermissions?.[actor]===true;
 const labels={pending_developer:'待开发者审核',pending_platform:'待平台审核',awaiting_payment:'待线下退款',completed:'已完成',rejected:'已驳回',cancelled:'已撤销'};
 const active=r=>!['completed','rejected','cancelled'].includes(r.status);
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const fmt=n=>(n/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
 const invoiceLocked=v=>['开票待审核','待审核','开票中','已开票'].includes(v);
 function seed(options={}){
  const batches=[
   {id:'RC20260814160631',time:'2026-08-14 16:06:31',payer:'示例科技有限公司',account:'招商银行 · 机构对公账户 · 尾号8888',purchased:100000,paid:100000,remaining:90945,principal:90945,invoice:'待开票'},
   {id:'RC20260812110726',time:'2026-08-12 11:07:26',payer:'张敏',account:'微信支付 · 原付款账户',purchased:10000,paid:10000,remaining:7000,principal:7000,invoice:'待开票'},
   {id:'RC20260805091230',time:'2026-08-05 09:12:30',payer:'示例科技有限公司',account:'机构对公账户 · 尾号8888',purchased:50000,paid:50000,remaining:30440,principal:30440,invoice:'开票中'},
   {id:'RC20260728101502',time:'2026-07-28 10:15:02',payer:'示例科技有限公司',account:'机构对公账户 · 尾号8888',purchased:200000,paid:200000,remaining:0,principal:0,invoice:'已开票',traceable:false},
   {id:'RC20260722143010',time:'2026-07-22 14:30:10',payer:'张敏',account:'微信支付 · 原付款账户',purchased:50000,paid:50000,remaining:0,principal:0,invoice:'已开票',traceable:false}
  ].map(b=>({frozen:0,refunded:0,traceable:true,bonus:0,...b}));
  const consumptions=[
   {id:'USE20260818143621',time:'2026-08-18 14:36:21',name:'采购需求分析智能体',member:'张敏',beans:1040,cash:1040,cost:104,invoice:'待开票',sources:[{id:batches[0].id,beans:1040,cash:1040}]},
   {id:'USE20260816102205',time:'2026-08-16 10:22:05',name:'合规监测智能体',member:'陈晓',beans:0,cash:0,cost:0,invoice:'不可开票',callStatus:'失败',sources:[]},
   {id:'USE20260815110531',time:'2026-08-15 11:05:31',name:'合规监测智能体',member:'王晨',beans:8015,cash:8015,cost:802,invoice:'待开票',settlement:'已进入结算',sources:[{id:batches[0].id,beans:8015,cash:8015}]},
   {id:'USE20260813145208',time:'2026-08-13 14:52:08',name:'采购需求分析智能体',member:'王晨',beans:19560,cash:19560,cost:1956,invoice:'开票中',sources:[{id:batches[2].id,beans:19560,cash:19560}]},
   {id:'USE20260812094206',time:'2026-08-12 09:42:06',name:'智能体内容助手',member:'张敏',beans:3000,cash:3000,cost:300,invoice:'待开票',sources:[{id:batches[1].id,beans:3000,cash:3000}]},
   {id:'USE20260808152612',time:'2026-08-08 15:26:12',name:'政府采购数据分析智能体',member:'李用户',beans:10924,cash:10924,cost:1092,invoice:'已开票',sources:[]}
  ].map(c=>({developer:'dev-caiyi',share:80,callStatus:'成功',settlement:'未进入结算',returned:false,...c}));
  const permissions={...defaultPermissions(),...(options.menuPermissions||{})};
  const state={version:1,revision:0,sequence:0,menuPermissions:permissions,menuPermissionHistory:[],org:'示例科技有限公司',legacyBalance:1741615,batches,consumptions,refunds:[],invoiceRequests:[],ledger:[]};
  if (options.demo) { state.menuPermissions={owner:true,member:false,developer:true,admin:true}; addDemoData(state); state.menuPermissions=permissions; }
  return state;
 }
 function addDemoData(s){
  const addBatch=(id,paid,remaining,invoice='待开票')=>{const batch={id,time:'2026-09-12 09:00:00',payer:'示例科技有限公司',account:'招商银行 · 机构对公账户 · 尾号8888',purchased:paid,paid,remaining,principal:remaining,frozen:0,refunded:0,traceable:true,bonus:0,invoice};s.batches.push(batch);return batch;};
  const addUse=(id,name,member,beans,cost,batch,invoice='待开票',settlement='未进入结算',returned=false)=>{const use={id,time:'2026-09-12 14:30:00',name,member,beans,cash:beans,cost,invoice,settlement,returned,callStatus:'成功',developer:'dev-caiyi',share:80,sources:[{id:batch.id,beans,cash:beans}]};s.consumptions.push(use);return use;};
  const pendingPlatformBatch=addBatch('RC20260912090001',20000,9000);
  const awaitingBatch=addBatch('RC20260912090002',15000,6000);
  const secondAwaitingBatch=addBatch('RC20260912090003',12000,5000);
  const completedBatch=addBatch('RC20260912090004',8000,8000);
  const cancelledBatch=addBatch('RC20260912090005',9000,9000);
  const developerUseBatch=addBatch('RC20260912090006',10000,8800);
  const platformUseBatch=addBatch('RC20260912090007',10000,8200);
  const completedUseBatch=addBatch('RC20260912090008',10000,7500);
  const rejectedUseBatch=addBatch('RC20260912090009',10000,9100);
  const cancelledUseBatch=addBatch('RC20260912090010',10000,9300);
  const pendingDeveloper=addUse('USE202609130001','采购合规审查智能体','王晨',1200,120,developerUseBatch);
  const pendingPlatform=addUse('USE202609130002','招标文件分析智能体','陈晓',1800,180,platformUseBatch);
  const completedUse=addUse('USE202609130003','政策问答智能体','张敏',2500,300,completedUseBatch);
  const rejectedUse=addUse('USE202609130004','合同风险识别智能体','李用户',900,90,rejectedUseBatch);
  const cancelledUse=addUse('USE202609130005','供应商信息核验智能体','王晨',700,70,cancelledUseBatch);
  const now='2026-09-13 ';
  // 用真实状态转移生成样例，保证冻结、流水、处理记录与页面操作一致。
  const steps=[
   {key:'cancelledUse',type:'consumption',order:cancelledUse,at:'06:30:00',ops:[['submit','owner'],['cancel','owner']]},
   {key:'cancelledRecharge',type:'recharge',order:cancelledBatch,at:'06:50:00',ops:[['submit','owner'],['cancel','owner']]},
   {key:'rejectedUse',type:'consumption',order:rejectedUse,at:'07:20:00',ops:[['submit','owner'],['reject','developer']]},
   {key:'completedUse',type:'consumption',order:completedUse,at:'07:30:00',ops:[['submit','owner'],['approve','developer'],['approve','admin']]},
   {key:'completedRecharge',type:'recharge',order:completedBatch,at:'07:40:00',ops:[['submit','owner'],['approve','admin'],['pay','admin']]},
   {key:'secondAwaitingRecharge',type:'recharge',order:secondAwaitingBatch,at:'08:10:00',ops:[['submit','owner'],['approve','admin']]},
   {key:'awaitingRecharge',type:'recharge',order:awaitingBatch,at:'08:40:00',ops:[['submit','owner'],['approve','admin']]},
   {key:'pendingPlatformUse',type:'consumption',order:pendingPlatform,at:'09:20:00',ops:[['submit','owner'],['approve','developer']]},
   {key:'pendingPlatformRecharge',type:'recharge',order:pendingPlatformBatch,at:'09:25:00',ops:[['submit','owner']]},
   {key:'pendingDeveloper',type:'consumption',order:pendingDeveloper,at:'09:30:00',ops:[['submit','owner']]}
  ];
  for(const step of steps){let current;for(const [kind,who] of step.ops){const time=now+step.at;if(kind==='submit'){current=apply(s,{kind:'submit',type:step.type,orderId:step.order.id,reason:step.type==='recharge'?'业务需求调整':'结果不符合约定',note:'示例退款处理'},who,time);}else{const refund=current.refunds.find(r=>r.type===step.type&&r.orderId===step.order.id&&active(r));const action={kind,id:refund.id,note:kind==='reject'?'服务已按约交付':'',...(kind==='approve'&&who==='admin'&&step.type==='consumption'?{costBearer:'platform'}:{}),...(kind==='pay'?{amount:refund.cash,paidAt:time.replace(' ','T'),reference:'BANK-DEMO-'+step.key,confirmed:true,receipt:{name:'付款回单-示例.png',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='}}:{})};current=apply(current,action,who,time);}s.version=current.version;s.revision=current.revision;s.sequence=current.sequence;s.batches=current.batches;s.consumptions=current.consumptions;s.refunds=current.refunds;s.invoiceRequests=current.invoiceRequests;s.ledger=current.ledger;}
  }
  // 付款登记规则要求回单；样例回单只用于触发演示，页面仍会显示下载入口。
  s.demoSeed=true;
  return s;
 }
 function summary(s){const total=s.legacyBalance+s.batches.reduce((n,b)=>n+b.remaining,0),frozen=s.batches.reduce((n,b)=>n+b.frozen,0);return {total,frozen,available:total-frozen};}
 function order(s,type,id){return(type==='recharge'?s.batches:type==='consumption'?s.consumptions:[]).find(x=>x.id===id);}
 function current(s,type,id){return s.refunds.find(r=>r.type===type&&r.orderId===id&&active(r));}
 function eligibility(s,type,id){
  const o=order(s,type,id);if(!o)return '原订单来源未核实，暂不支持退款';
  if(invoiceLocked(o.invoice))return '该订单'+o.invoice+'，暂不支持退款';
  if(current(s,type,id))return '该订单有进行中的退款申请';
  if(type==='recharge'){
   if(!o.traceable||o.bonus)return '原充值来源或赠送彩豆未核实，暂不能退款';
   if(o.remaining-o.frozen<=0||o.principal<=0)return '该订单暂无可退剩余彩豆';
  }else{
   if(o.returned)return '该消费已退豆，不可重复退款';
   if(o.callStatus!=='成功'||o.beans<=0)return '该调用未实际扣费，无需退款';
   if(o.settlement!=='未进入结算')return '该消费已进入结算，暂不支持退款';
   if(!o.sources.length||o.sources.some(x=>!order(s,'recharge',x.id))||o.sources.reduce((n,x)=>n+x.beans,0)!==o.beans)return '消费来源未核实，暂不能退款';
  }
  return '';
 }
 function invoiceReason(s,type,id){
  const o=order(s,type,id);if(!o)return '原订单未核实';
  if(invoiceLocked(o.invoice))return o.invoice;
  if(current(s,type,id))return '退款处理中，暂不能开票';
  if(type==='consumption'&&(o.returned||o.beans<=0))return '已退豆或未扣费，不可开票';
  if(type==='recharge'&&o.refunded>0)return '该充值已发生退款，暂不支持部分开票';
  return '';
 }
 function validate(s){
  check(s&&s.version===1&&Number.isSafeInteger(s.revision)&&Array.isArray(s.batches)&&Array.isArray(s.consumptions)&&Array.isArray(s.refunds)&&Array.isArray(s.ledger),'退款数据格式异常，请联系管理员核实，原数据已保留');
  check(s.menuPermissions&&Object.keys(permissionTargets).every(actor=>typeof s.menuPermissions[actor]==='boolean')&&Array.isArray(s.menuPermissionHistory),'菜单权限数据异常');
  check(Number.isSafeInteger(s.legacyBalance)&&s.legacyBalance>=0,'历史余额异常');
  s.batches.forEach(b=>{
   ['paid','purchased','remaining','principal','frozen','refunded'].forEach(k=>check(Number.isSafeInteger(b[k])&&b[k]>=0,'充值账本数据异常'));
   check(b.frozen<=b.remaining&&b.remaining<=b.purchased&&b.principal+b.refunded<=b.paid,'充值余额与冻结/本金不一致');
  });
  s.consumptions.forEach(c=>{
   ['beans','cash','cost'].forEach(k=>check(Number.isSafeInteger(c[k])&&c[k]>=0,'消费金额数据异常'));
   check(Array.isArray(c.sources),'消费来源数据异常');
   if(c.sources.length){
    c.sources.forEach(x=>check(Number.isSafeInteger(x.beans)&&x.beans>0&&Number.isSafeInteger(x.cash)&&x.cash>=0,'消费来源数量或本金异常'));
    check(c.sources.reduce((n,x)=>n+x.beans,0)===c.beans&&c.sources.reduce((n,x)=>n+x.cash,0)===c.cash,'消费来源合计与原扣彩豆/本金不一致');
   }
  });
  check(new Set(s.refunds.map(r=>r.id)).size===s.refunds.length,'退款单号重复');
  s.refunds.forEach(r=>check(labels[r.status]&&order(s,r.type,r.orderId),'退款状态或原单异常'));
  return s;
 }
 function read(storage,options={}){
  const raw=storage.getItem(KEY);
  try{
   const data=raw?JSON.parse(raw):seed({demo:true});
   if(data.menuPermissions===undefined)data.menuPermissions=defaultPermissions();
   if(data.menuPermissionHistory===undefined)data.menuPermissionHistory=[];
   // 兼容已存在的待核实付款单，不删除余额、回单或历史处理记录。
   if(Array.isArray(data.refunds))data.refunds.forEach(r=>{if(r.status==='payment_exception')r.status='awaiting_payment';});
   validate(data);
   // 演示入口预置授权；保存后的手动撤权继续生效，不改变正式默认权限。
   if(options.demoAccess===true&&data.demoMenuPermissionsInitialized!==true){
    Object.keys(permissionTargets).forEach(actor=>{data.menuPermissions[actor]=true;});
    data.demoMenuPermissionsInitialized=true;
   }
   return data;
  }catch(e){throw Error('退款记录读取失败：'+e.message);}
 }
 function save(storage,s){validate(s);storage.setItem(KEY,JSON.stringify(s));return s;}
 function apply(source,a,actor,now=new Date().toLocaleString('sv-SE')){
  check(['set_menu_permission','submit','cancel','approve','reject','pay','invoice','invoice_cancel','invoice_reject','settle','debit'].includes(a.kind),'不支持的退款操作');
  validate(source);const s=JSON.parse(JSON.stringify(source)),before=summary(s);s.invoiceRequests=s.invoiceRequests||[];
  const actorName={owner:'单位主账号',member:'单位子账号',developer:'开发者',admin:'平台'}[actor]||'未知';
  function event(r,name,note){r.timeline.push({time:now,actor:actorName,name,note:note||''});}
  function ledger(r,name,total,frozen){const after=summary(s);s.ledger.unshift({id:r.id+'-'+s.ledger.length,refundId:r.id,orderId:r.orderId,time:now,name,totalDelta:total,frozenDelta:frozen,before:before.total,after:after.total,available:after.available});}
  function release(r){if(r.type==='recharge'){order(s,'recharge',r.orderId).frozen-=r.beans;ledger(r,'退款解冻',0,-r.beans);}}
  if(['submit','cancel','approve','reject','pay'].includes(a.kind))check(hasMenuPermission(s,actor),'当前账号未获得退款管理菜单权限');
  if(a.kind==='set_menu_permission'){
   check(actor==='admin','无菜单授权管理权限');check(Object.hasOwn(permissionTargets,a.target),'授权身份无效');check(typeof a.enabled==='boolean','菜单授权值无效');
   if(a.expectedEnabled!==undefined)check(a.expectedEnabled===s.menuPermissions[a.target],'菜单权限已变化，请刷新后重试');
   if(s.menuPermissions[a.target]===a.enabled)return s;
   const previous=s.menuPermissions[a.target];s.menuPermissions[a.target]=a.enabled;
   s.menuPermissionHistory.unshift({time:now,actor:actorName,target:a.target,menu:'refund-manage',previous,enabled:a.enabled});
  }else if(a.kind==='submit'){
   check(['owner','member'].includes(actor),'仅企业用户可申请退款');check(['recharge','consumption'].includes(a.type),'退款类型无效');
   const reason=eligibility(s,a.type,a.orderId);check(!reason,reason);
   check(typeof a.reason==='string'&&a.reason.trim().length>=2&&a.reason.length<=80,'请选择退款原因');check(!a.note||a.note.length<=500,'补充说明不能超过500字');
   const o=order(s,a.type,a.orderId),beans=a.type==='recharge'?o.remaining-o.frozen:o.beans,cash=a.type==='recharge'?o.principal:0;
   if(a.expectedBeans!==undefined)check(a.expectedBeans===beans,'可退余额已变化，请刷新核对后重新申请');
   const r={id:'RF'+now.slice(0,10).replace(/-/g,'')+String(++s.sequence).padStart(4,'0'),type:a.type,orderId:o.id,org:s.org,beans,cash,reason:a.reason.trim(),note:a.note||'',created:now,status:a.type==='recharge'?'pending_platform':'pending_developer',timeline:[],payer:o.payer||'',account:o.account||'',developer:o.developer||'',sourceSnapshot:a.type==='consumption'?o.sources:[],originalReceivable:a.type==='consumption'?Math.round(o.cash*o.share/100)-o.cost:0};
   r.applicant=actor;s.refunds.unshift(r);event(r,'提交申请',r.reason);
   if(r.type==='recharge'){o.frozen+=beans;ledger(r,'退款冻结',0,beans);}
  }else if(a.kind==='invoice'){
   check(actor==='owner','仅单位主账号操作当前原型开票');check(Array.isArray(a.ids)&&a.ids.length>0,'请选择订单');
   check(new Set(a.ids).size===a.ids.length,'不能重复选择同一订单');
   a.ids.forEach(id=>check(!invoiceReason(s,a.type,id),invoiceReason(s,a.type,id)));
   s.invoiceRequests.unshift({id:'FP'+now.slice(0,10).replace(/-/g,'')+String(++s.sequence).padStart(4,'0'),type:a.type,ids:a.ids.slice(),amount:a.ids.reduce((n,id)=>{const o=order(s,a.type,id);return n+(a.type==='recharge'?o.paid:o.cash);},0),created:now,status:'待审核',previous:a.ids.map(id=>order(s,a.type,id).invoice)});
   a.ids.forEach(id=>{order(s,a.type,id).invoice='开票待审核';});
  }else if(a.kind==='invoice_cancel'||a.kind==='invoice_reject'){
   check(a.kind==='invoice_cancel'?actor==='owner':actor==='admin','无开票处理权限');
   const request=s.invoiceRequests.find(x=>x.id===a.id);check(request&&request.status==='待审核','该开票申请已处理或不存在');
   check(a.note&&a.note.trim().length>=2&&a.note.length<=500,'请填写撤销或驳回原因');
   request.ids.forEach(id=>check(order(s,request.type,id)?.invoice==='开票待审核','开票占用状态已变化，请核实'));
   request.ids.forEach((id,i)=>{order(s,request.type,id).invoice=request.previous[i];});
   request.status=a.kind==='invoice_cancel'?'已撤销':'已驳回';request.note=a.note.trim();request.handledAt=now;
  }else if(a.kind==='settle'){
   check(actor==='admin','无结算操作权限');check(a.ids&&a.ids.length,'请选择消费');
   a.ids.forEach(id=>check(order(s,'consumption',id)&&!current(s,'consumption',id),'消费退款处理中，不得进入结算'));
   a.ids.forEach(id=>{order(s,'consumption',id).settlement='已进入结算';});
  }else if(a.kind==='debit'){
   check(actor==='owner','无消费权限');check(Number.isSafeInteger(a.beans)&&a.beans>0,'扣减数量无效');check(!order(s,'consumption',a.id),'消费单号重复');
   const batches=s.batches.filter(b=>b.traceable).sort((a,b)=>a.time.localeCompare(b.time));
   check(batches.reduce((n,b)=>n+b.remaining-b.frozen,0)>=a.beans,'可用来源余额不足');
   let left=a.beans;const sources=[];
   batches.forEach(b=>{const beans=Math.min(left,b.remaining-b.frozen);if(!beans)return;const cash=beans===b.remaining?b.principal:Math.floor(b.principal*beans/b.remaining);b.remaining-=beans;b.principal-=cash;left-=beans;sources.push({id:b.id,beans,cash});});
   s.consumptions.unshift({id:a.id,name:'智能体调用',time:now,member:'张敏',beans:a.beans,cash:sources.reduce((n,x)=>n+x.cash,0),cost:0,share:80,developer:'dev-caiyi',invoice:'待开票',settlement:'未进入结算',returned:false,callStatus:'成功',sources});
  }else{
   const r=s.refunds.find(x=>x.id===a.id);check(r,'退款单不存在');const o=order(s,r.type,r.orderId);
   const reviewAllowed=actor==='admin'&&r.status==='pending_platform'||actor==='developer'&&r.type==='consumption'&&r.status==='pending_developer'&&o.developer==='dev-caiyi';
   if(a.kind==='cancel'){
    check(['owner','member'].includes(actor)&&['pending_developer','pending_platform'].includes(r.status),'当前状态不允许撤销');release(r);r.status='cancelled';event(r,'撤销申请');
   }else if(a.kind==='reject'){
    check(reviewAllowed,'无权处理该审核环节');check(a.note&&a.note.trim().length>=2&&a.note.length<=500,'请填写驳回原因');release(r);r.status='rejected';event(r,'驳回申请',a.note.trim());
   }else if(a.kind==='approve'){
    check(reviewAllowed,'无权处理该审核环节');check(!invoiceLocked(o.invoice),'原单正在开票，不可通过退款');
    if(actor==='developer'){r.status='pending_platform';event(r,'开发者审核通过',a.note);}
    else if(r.type==='recharge'){r.status='awaiting_payment';event(r,'平台审核通过','等待线下付款，冻结彩豆保持不变');}
    else{
     check(o.settlement==='未进入结算'&&!o.returned,'原单已结算或已退豆');check(['platform','developer'].includes(a.costBearer),'请选择算力成本承担方');
     o.sources.forEach(x=>{const b=order(s,'recharge',x.id);check(b,'找不到原充值来源');b.remaining+=x.beans;b.principal+=x.cash;});
     o.returned=true;r.costBearer=a.costBearer;r.finalReceivable=a.costBearer==='platform'?0:-o.cost;r.adjustment=r.finalReceivable-r.originalReceivable;r.status='completed';r.completed=now;
     ledger(r,'消费退豆',r.beans,0);event(r,'平台审核通过并退豆',fmt(r.beans)+' 彩豆已退回原单位账户');
    }
   }else if(a.kind==='pay'){
    check(actor==='admin'&&r.type==='recharge'&&r.status==='awaiting_payment','当前状态不能登记付款');
    check(a.amount===r.cash,'实际退款金额必须等于批准金额');check(a.confirmed===true,'请确认已实际完成付款');
    check(typeof a.reference==='string'&&a.reference.trim().length>=4&&a.reference.length<=80,'请填写付款流水号');
    check(!s.refunds.some(x=>x.payment&&x.payment.reference===a.reference.trim()),'该付款流水号已登记，请核实避免重复');
    check(a.paidAt&&Number.isFinite(Date.parse(a.paidAt))&&Date.parse(a.paidAt)<=Date.parse(now),'付款时间无效或晚于当前时间');
    check(a.receipt&&typeof a.receipt.data==='string'&&/^data:(image\/(png|jpeg)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(a.receipt.data)&&a.receipt.data.length<=1450000&&typeof a.receipt.name==='string'&&a.receipt.name.length<=150,'请上传1MB以内的PNG、JPG或PDF付款回单');
    check(o.frozen>=r.beans&&o.remaining>=r.beans&&o.principal>=r.cash,'冻结余额异常，暂不能完成');
    o.frozen-=r.beans;o.remaining-=r.beans;o.principal-=r.cash;o.refunded+=r.cash;
    r.payment={amount:a.amount,time:a.paidAt,reference:a.reference.trim(),receipt:a.receipt};r.status='completed';r.completed=now;ledger(r,'充值退款扣豆',-r.beans,-r.beans);event(r,'线下退款已登记',a.reference.trim());
   }else throw Error('不支持的退款操作');
  }
  s.revision++;return validate(s);
 }
 return {KEY,labels,permissionTargets,hasMenuPermission,active,fmt,seed,summary,order,current,eligibility,invoiceReason,validate,read,save,apply};
});
