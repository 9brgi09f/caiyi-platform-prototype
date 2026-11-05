(function(){
 'use strict';
 const R=window.CaiyiRefund,T=window.RefundRuntime,$=id=>document.getElementById(id),root=$('refundApp');
 const role=document.body.dataset.refundRole,pageType=document.body.dataset.refundPage;
 const query=new URLSearchParams(location.search);
 let tab=role==='user'?(query.get('tab')||'recharge'):'records',page=1,keyword='',status='',busy=false,pending=null,receipt=null;
 if(!['recharge','consumption','records'].includes(tab))tab='recharge';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const amount=(n,unit='彩豆')=>R.fmt(n)+' '+unit;
 const typeName=t=>t==='recharge'?'充值退款':'消费退豆';
 const stateName=r=>r.status==='completed'?(r.type==='recharge'?'已退款':'已退豆'):R.labels[r.status];
 const badge=r=>'<span class="rf-status '+r.status+'">'+stateName(r)+'</span>';
 const field=(label,value,cls='')=>'<div class="'+cls+'"><dt>'+label+'</dt><dd>'+value+'</dd></div>';
 const detailLink=r=>'refund-view.html?id='+encodeURIComponent(r.id);
 function err(message){let el=$('pageError');if(!el){el=document.createElement('p');el.id='pageError';el.className='rf-error';el.setAttribute('role','alert');root.prepend(el);}el.textContent=message;}
 function visible(s){return s.refunds.filter(r=>role!=='developer'||r.type==='consumption'&&r.developer==='dev-caiyi');}
 function head(title,back){return(back?'<a class="rf-back" href="refund-list.html?tab=records">← 返回退款记录</a>':'')+'<div class="rf-page-head"><h2>'+title+'</h2></div><p id="pageError" class="rf-error" role="alert"></p>';}
 function denyAccess(){
  pending=null;receipt=null;if($('refundConfirm').open)$('refundConfirm').close();
  $('confirmMessage').textContent='';$('confirmError').textContent='';
  root.innerHTML=head('退款管理')+'<p class="rf-notice" role="alert">当前账号未获得退款管理菜单权限，请联系权限管理员授权。</p>';
 }
 function render(){
  try{
   const s=T.read();if(!T.hasPermission()){denyAccess();return;}
   if(pageType==='list')renderList(s);else renderView(s);
  }catch(e){denyAccess();err('无法读取退款记录，请刷新重试。'+e.message);}
 }
 function renderList(s){
  const sum=R.summary(s),items=visible(s),pendingCount=items.filter(r=>R.active(r)).length;
  const stats=role==='user'?[
   ['单位总余额',amount(sum.total)],['退款冻结',amount(sum.frozen)],['可用余额',amount(sum.available)]
  ]:[['待'+(role==='developer'?'开发者':'平台')+'审核',items.filter(r=>r.status===(role==='developer'?'pending_developer':'pending_platform')).length+' 笔'],['处理中',pendingCount+' 笔'],['已完成',items.filter(r=>r.status==='completed').length+' 笔']];
  root.innerHTML=head('退款管理')+'<div class="rf-stats">'+stats.map(([label,value])=>'<div class="rf-stat"><span>'+label+'</span><b>'+value.split(' ')[0]+'<small>'+value.split(' ').slice(1).join(' ')+'</small></b></div>').join('')+'</div>'+
   (role==='user'?'<div class="rf-tabs" role="tablist" aria-label="退款类型">'+[['recharge','充值退款'],['consumption','消费退豆'],['records','申请记录']].map(([id,label])=>'<button type="button" data-tab="'+id+'" role="tab" aria-selected="'+(tab===id)+'">'+label+'</button>').join('')+'</div>':'')+
   '<form class="rf-toolbar" id="refundFilters"><input id="refundKeyword" aria-label="搜索订单或退款单" placeholder="搜索订单、退款单或智能体" value="'+esc(keyword)+'"/>'+(tab==='records'?'<select id="refundStatus" aria-label="退款状态"><option value="">全部状态</option>'+Object.entries(R.labels).map(([k,v])=>'<option value="'+k+'" '+(status===k?'selected':'')+'>'+v+'</option>').join('')+'</select>':'')+'<button class="btn btn-primary" type="submit">查询</button><button class="btn btn-outline" type="reset">重置</button></form><div id="refundTable"></div>';
  root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;keyword='';status='';page=1;history.replaceState(null,'','refund-list.html?tab='+tab);render();});
  $('refundFilters').onsubmit=e=>{e.preventDefault();keyword=$('refundKeyword').value.trim();status=$('refundStatus')?.value||'';page=1;renderTable(s);};
  $('refundFilters').onreset=()=>{keyword='';status='';page=1;render();};
  renderTable(s);
 }
 function renderTable(s){
  const isRecords=tab==='records',all=isRecords?visible(s):(tab==='recharge'?s.batches:s.consumptions);
  const filtered=all.filter(o=>(!keyword||[o.id,o.orderId,o.name,o.reason].join(' ').toLowerCase().includes(keyword.toLowerCase()))&&(!status||o.status===status));
  const pages=Math.max(1,Math.ceil(filtered.length/8));page=Math.min(page,pages);
  const headings=isRecords?['退款单 / 原订单','退款类型','退款金额 / 彩豆','申请时间','状态','操作']:tab==='recharge'?['充值单 / 时间','充值人 / 方式','实付金额','剩余彩豆','开票状态','操作']:['消费单 / 智能体','消费人','原扣彩豆','开票 / 结算','可退彩豆','操作'];
  let html='<div class="rf-table-wrap"><table class="rf-table"><thead><tr>'+headings.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>';
  for(const o of filtered.slice((page-1)*8,page*8)){
   if(isRecords){html+='<tr><td class="rf-order">'+o.id+'<small>'+o.orderId+'</small></td><td>'+typeName(o.type)+'</td><td class="rf-amount">'+(o.type==='recharge'?'¥'+R.fmt(o.cash):amount(o.beans))+'</td><td>'+o.created+'</td><td>'+badge(o)+'</td><td><a class="btn btn-sm btn-outline" href="'+detailLink(o)+'">'+(role==='user'?'查看':'查看 / 处理')+'</a></td></tr>';continue;}
   const reason=R.eligibility(s,tab,o.id),current=R.current(s,tab,o.id),last=s.refunds.find(r=>r.type===tab&&r.orderId===o.id);
   let action=current?'<a class="rf-inline" href="'+detailLink(current)+'">'+stateName(current)+' →</a>':!reason?'<a class="btn btn-sm btn-primary" href="refund-view.html?type='+tab+'&order='+o.id+'">申请'+(tab==='recharge'?'退款':'退豆')+'</a>':'<span class="rf-reason">'+esc(reason)+'</span>';
   if(last&&!current)action+='<a class="btn btn-sm btn-outline" href="'+detailLink(last)+'">查看退款记录</a>';
   action='<div class="rf-order-actions">'+action+'</div>';
   if(tab==='recharge')html+='<tr><td class="rf-order">'+o.id+'<small>'+o.time+'</small></td><td>'+esc(o.payer)+'<small>'+esc(o.account)+'</small></td><td class="rf-amount">¥'+R.fmt(o.paid)+'</td><td class="rf-amount">'+R.fmt(o.remaining)+'<small>冻结 '+R.fmt(o.frozen)+'</small></td><td>'+esc(o.invoice)+'</td><td>'+action+'</td></tr>';
   else html+='<tr><td class="rf-order">'+o.id+'<small>'+esc(o.name)+'</small></td><td>'+esc(o.member)+'</td><td class="rf-amount">'+amount(o.beans)+'</td><td>'+esc(o.invoice)+'<small>'+esc(o.settlement)+'</small></td><td class="rf-amount">'+(reason?'—':amount(o.beans))+'</td><td>'+action+'</td></tr>';
  }
  if(!filtered.length)html+='<tr><td colspan="6" class="rf-empty">'+(keyword||status?'没有符合条件的记录':'暂无退款申请')+'</td></tr>';
  html+='</tbody></table></div><div class="rf-pager"><span>共 '+filtered.length+' 条记录，每页 8 条</span><div><button id="rfPrev" type="button" aria-label="上一页" '+(page<=1?'disabled':'')+'>‹</button><span>'+page+' / '+pages+'</span><button id="rfNext" type="button" aria-label="下一页" '+(page>=pages?'disabled':'')+'>›</button></div></div>';
  if(tab==='recharge')html+='<p class="rf-muted">仅退原充值单剩余本金；提交后冻结对应彩豆，审核通过后安排线下退款。部分历史余额来源待核实，暂不纳入可退额度。</p>';
  if(tab==='consumption')html+='<p class="rf-muted">仅退原扣彩豆，不退现金。已开票、正在开票或已进入结算的消费，暂不支持退款。</p>';
  $('refundTable').innerHTML=html;$('rfPrev').onclick=()=>{page--;renderTable(s);};$('rfNext').onclick=()=>{page++;renderTable(s);};
 }
 function renderView(s){
  const id=query.get('id');
  if(!id){renderApply(s);return;}
  const r=visible(s).find(x=>x.id===id);
  if(!r){root.innerHTML=head('退款详情',true)+'<p class="rf-notice">退款记录不存在，或当前账号无权查看。</p>';return;}
  const o=R.order(s,r.type,r.orderId);
  root.innerHTML=head(typeName(r.type)+'详情',true)+'<div class="rf-page-head"><span class="rf-muted">'+r.id+'</span>'+badge(r)+'</div>'+
   '<section class="rf-section"><h3>申请信息</h3><dl class="rf-fields">'+field('原订单号',esc(r.orderId))+field('申请单位',esc(r.org))+field('申请时间',esc(r.created))+field(r.type==='recharge'?'退款金额':'退回彩豆',r.type==='recharge'?'¥'+R.fmt(r.cash):amount(r.beans),'rf-strong')+field('关联彩豆',amount(r.beans))+field('申请人',r.applicant==='member'?'单位子账号':'单位主账号')+field('退款原因',esc(r.reason))+field('补充说明',esc(r.note||'无'),'rf-wide')+(r.type==='recharge'?field('原收款主体',esc(r.payer))+field('原收款账户',esc(r.account),'rf-wide'):field('智能体',esc(o.name))+field('消费人',esc(o.member))+field('退回账户','原单位彩豆账户'))+'</dl></section>'+
   (r.type==='consumption'?sourceView(r,o):'')+
   (r.payment?'<section class="rf-section"><h3>线下付款记录</h3><dl class="rf-fields">'+field('实际退款','¥'+R.fmt(r.payment.amount))+field('付款时间',esc(r.payment.time.replace('T',' ')))+field('付款流水号',esc(r.payment.reference))+field('付款回单','<button class="btn btn-outline" id="receiptDownload" type="button">下载 '+esc(r.payment.receipt.name)+'</button>','rf-wide')+'</dl></section>':'')+
   '<div id="refundAction"></div><section class="rf-section"><h3>处理记录</h3><ol class="rf-timeline">'+r.timeline.map(t=>'<li><b>'+esc(t.name)+'</b><small>'+esc(t.actor)+' · '+esc(t.time)+'</small><p>'+esc(t.note)+'</p></li>').join('')+'</ol></section>';
  if($('receiptDownload'))$('receiptDownload').onclick=()=>{try{if(!T.hasPermission()){denyAccess();return;}}catch(e){denyAccess();err(e.message);return;}const a=document.createElement('a');a.href=r.payment.receipt.data;a.download=r.payment.receipt.name;document.body.appendChild(a);a.click();a.remove();};
  renderActions(r,o);
 }
 function sourceView(r,o){
  const original=r.originalReceivable;
  return '<section class="rf-section"><h3>彩豆来源</h3><div class="rf-table-wrap"><table class="rf-table"><thead><tr><th>原充值单</th><th>恢复彩豆</th><th>恢复本金</th></tr></thead><tbody>'+o.sources.map(x=>'<tr><td>'+esc(x.id)+'</td><td>'+amount(x.beans)+'</td><td>¥'+R.fmt(x.cash)+'</td></tr>').join('')+'</tbody></table></div></section>'+
   (role!=='user'?'<section class="rf-section"><h3>结算影响</h3><dl class="rf-fields">'+field('原消费现金口径','¥'+R.fmt(o.cash))+field('实际算力成本','¥'+R.fmt(o.cost))+field('原开发者应收','¥'+R.fmt(original))+field('结算状态',R.active(r)?'退款处理中，暂缓结算':r.status==='completed'?'按退款调整结果结算':'恢复原结算资格')+(r.status==='completed'?field('算力成本承担方',r.costBearer==='platform'?'平台':'开发者')+field('调整后应收','¥'+R.fmt(r.finalReceivable))+field('应收调整','¥'+R.fmt(r.adjustment)):'')+'</dl></section>':'');
 }
 function renderApply(s){
  const type=query.get('type'),id=query.get('order'),o=R.order(s,type,id);
  if(role!=='user'||!o){root.innerHTML=head('申请退款',true)+'<p class="rf-notice">请从原订单选择退款。</p>';return;}
  const reason=R.eligibility(s,type,id);const beans=type==='recharge'?o.remaining-o.frozen:o.beans;
  root.innerHTML=head('申请'+typeName(type),true)+'<section class="rf-section"><h3>原订单</h3><dl class="rf-fields">'+field('订单号',esc(id))+field('单位',esc(s.org))+field('开票状态',esc(o.invoice))+field(type==='recharge'?'本次退款金额':'本次退回彩豆',type==='recharge'?'¥'+R.fmt(o.principal):amount(beans),'rf-strong')+field(type==='recharge'?'冻结彩豆':'退回账户',type==='recharge'?amount(beans):'原单位彩豆账户')+(type==='recharge'?field('原付款主体',esc(o.payer))+field('退款至',esc(o.account),'rf-wide'):field('智能体',esc(o.name))+field('结算状态',esc(o.settlement)))+'</dl></section>'+
   (reason?'<p class="rf-notice">'+esc(reason)+'</p>':'<section class="rf-section"><h3>申请内容</h3><form class="rf-form" id="refundApply"><label for="applyReason">退款原因</label><select id="applyReason" required><option value="">请选择原因</option>'+ (type==='recharge'?['充值金额有误','业务需求调整','停止使用服务']:['结果不符合约定','重复扣费','服务未按约交付','其他']).map(t=>'<option>'+t+'</option>').join('')+'</select><label for="applyNote">补充说明</label><textarea id="applyNote" maxlength="500" placeholder="请补充具体情况，最多500字"></textarea><p class="rf-notice">'+(type==='recharge'?'本次退清原订单当前可退余额。提交后冻结对应彩豆；平台审核通过后线下退至原付款账户。':'开发者审核后提交平台终审，通过后退回原扣彩豆，不退现金。')+'</p><label class="rf-check"><input id="applyAgree" type="checkbox" required/>我已核对退款信息及处理规则</label><p class="rf-error" id="applyError" role="alert"></p><div class="rf-actions"><a class="btn btn-outline" href="refund-list.html?tab='+type+'">返回</a><button class="btn btn-primary" type="submit">提交申请</button></div></form></section>');
  if($('refundApply'))$('refundApply').onsubmit=e=>{e.preventDefault();confirm('确认提交'+typeName(type),'本次'+(type==='recharge'?'退 ¥'+R.fmt(o.principal)+'，提交后冻结 '+amount(beans):'申请退回 '+amount(beans))+'。',{kind:'submit',type,orderId:id,expectedBeans:beans,reason:$('applyReason').value,note:$('applyNote').value},true);};
 }
 function renderActions(r,o){
  const el=$('refundAction'),canReview=role==='developer'&&r.status==='pending_developer'||role==='admin'&&r.status==='pending_platform';
  if(role==='user'&&['pending_developer','pending_platform'].includes(r.status)){
   el.innerHTML='<section class="rf-section"><button class="btn btn-outline" id="cancelRefund" type="button">撤销申请</button></section>';
   $('cancelRefund').onclick=()=>confirm('撤销退款申请',r.type==='recharge'?'撤销后将释放本次冻结彩豆，原申请记录仍保留。':'撤销后将释放开票与结算占用，原申请记录仍保留。',{kind:'cancel',id:r.id});return;
  }
  if(canReview){
   el.innerHTML='<section class="rf-section"><h3>'+(role==='developer'?'开发者审核':'平台审核')+'</h3><form class="rf-form" id="reviewForm">'+(role==='admin'&&r.type==='consumption'?'<label for="costBearer">本次算力成本承担方</label><select id="costBearer"><option value="">请选择承担方</option><option value="platform">平台承担</option><option value="developer">开发者承担</option></select><p class="rf-notice" id="costImpact">通过前请选择承担方，核对开发者应收调整。</p>':'')+'<label for="reviewNote">审核意见</label><textarea id="reviewNote" maxlength="500" placeholder="驳回时必填，请说明原因"></textarea><div class="rf-actions"><button class="btn btn-outline" id="rejectRefund" type="button">驳回申请</button><button class="btn btn-primary" type="submit">'+(role==='admin'&&r.type==='consumption'?'通过并退豆':'审核通过')+'</button></div></form></section>';
   if($('costBearer'))$('costBearer').onchange=()=>{$('costImpact').textContent=$('costBearer').value?'调整后开发者应收 ¥'+R.fmt($('costBearer').value==='platform'?0:-o.cost)+'，相对原应收调整 ¥'+R.fmt(($('costBearer').value==='platform'?0:-o.cost)-r.originalReceivable)+'。':'请选择算力成本承担方。';};
   $('rejectRefund').onclick=()=>{const note=$('reviewNote').value.trim();if(note.length<2){err('请填写驳回原因');$('reviewNote').focus();return;}confirm('确认驳回','本次申请将被驳回并释放占用。',{kind:'reject',id:r.id,note});};
   $('reviewForm').onsubmit=e=>{e.preventDefault();const costBearer=$('costBearer')?.value;if(role==='admin'&&r.type==='consumption'&&!costBearer){err('请选择算力成本承担方');$('costBearer').focus();return;}confirm('确认审核通过',role==='developer'?'通过后进入平台审核，此时不会退豆。':r.type==='recharge'?'通过后进入待线下退款，彩豆保持冻结。':'通过后立即向原单位账户退回 '+amount(r.beans)+'，并调整对应应收。',{kind:'approve',id:r.id,note:$('reviewNote').value,costBearer});};return;
  }
  if(role==='admin'&&r.type==='recharge'&&r.status==='awaiting_payment'){
   el.innerHTML='<section class="rf-section"><h3>线下退款登记</h3><p class="rf-notice">请先核实实际付款结果，仅登记已完成的付款；未完成前保持待线下退款，请勿重复打款。退款至：'+esc(r.payer)+' / '+esc(r.account)+'</p><form class="rf-form" id="paymentForm"><label for="paidAmount">实际退款金额（元）</label><input id="paidAmount" value="'+(r.cash/100).toFixed(2)+'" readonly/><label for="paidAt">实际付款时间</label><input id="paidAt" type="datetime-local" required max="'+new Date().toLocaleString('sv-SE').slice(0,16).replace(' ','T')+'"/><label for="paymentReference">付款流水号</label><input id="paymentReference" maxlength="80" required placeholder="填写银行或支付渠道付款流水号"/><label for="paymentReceipt">付款回单</label><input id="paymentReceipt" type="file" accept="image/png,image/jpeg,application/pdf" required/><p class="rf-muted">PNG、JPG 或 PDF，最大 1MB。</p><label class="rf-check"><input id="paymentConfirmed" type="checkbox" required/>已核实实际付款成功，金额及收款对象与批准信息一致</label><div class="rf-actions"><button class="btn btn-primary" type="submit">登记退款完成</button></div></form></section>';
   $('paymentForm').onsubmit=async e=>{e.preventDefault();try{const file=$('paymentReceipt').files[0];if(!file||file.size>1024*1024||!['image/png','image/jpeg','application/pdf'].includes(file.type))throw Error('请上传1MB以内的PNG、JPG或PDF回单');receipt={name:file.name,data:await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('回单读取失败，请重试'));reader.readAsDataURL(file);})};confirm('确认登记退款完成','实际付款 ¥'+R.fmt(r.cash)+'。登记后将扣除冻结彩豆并完成退款，不能重复登记。',{kind:'pay',id:r.id,amount:r.cash,paidAt:$('paidAt').value,reference:$('paymentReference').value,receipt,confirmed:$('paymentConfirmed').checked});}catch(e){err(e.message);}};
  }else if(R.active(r))el.innerHTML='<p class="rf-notice">'+(r.status==='pending_developer'?'等待开发者审核。':r.status==='pending_platform'?'等待平台审核。':'等待线下付款结果登记，冻结彩豆保持不变。')+'</p>';
 }
 function confirm(title,message,action,isNew=false){
  try{if(!T.hasPermission()){denyAccess();return;}}catch(e){denyAccess();err(e.message);return;}
  pending={action,isNew};$('confirmTitle').textContent=title;$('confirmMessage').textContent=message;$('confirmError').textContent='';$('confirmExecute').disabled=false;$('refundConfirm').showModal();$('confirmCancel').focus();
 }
 $('confirmCancel').onclick=()=>{$('refundConfirm').close();};
 $('refundConfirm').addEventListener('close',()=>{if(!busy)pending=null;});
 $('confirmExecute').onclick=async()=>{if(!pending||busy)return;busy=true;$('confirmExecute').disabled=true;try{const {action,isNew}=pending,next=await T.commit(action);pending=null;$('refundConfirm').close();if(isNew)location.href=detailLink(next.refunds[0]);else{busy=false;render();}}catch(e){$('confirmError').textContent=e.message;$('confirmExecute').disabled=false;}finally{busy=false;}};
 window.addEventListener('refundchange',()=>{
  try{if(!T.hasPermission()){denyAccess();return;}}catch(e){denyAccess();err(e.message);return;}
  if(!busy){if(document.activeElement?.closest('.rf-form'))err('退款记录已更新，提交时将再次校验最新状态。');else render();}
 });
 window.addEventListener('pageshow',event=>{if(event.persisted)render();});
 render();
})();
