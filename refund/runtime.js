(function(){
 'use strict';
 const R=window.CaiyiRefund;
 function actor(){
  const side=document.querySelector('.sidebar');
  if(side?.classList.contains('admin'))return 'admin';
  if(side?.classList.contains('developer'))return 'developer';
  return sessionStorage.getItem('userRole')==='member'?'member':'owner';
 }
 function read(){return R.read(localStorage,{demoAccess:true});}
 function hasPermission(){return R.hasMenuPermission(read(),actor());}
 async function commit(action){
  const execute=()=>{
   const source=read();const next=R.apply(source,action,actor());
   R.save(localStorage,next);
   window.dispatchEvent(new CustomEvent('refundchange'));
   return next;
  };
  return navigator.locks?navigator.locks.request(R.KEY,execute):execute();
 }
 window.RefundRuntime={read,commit,actor,hasPermission};
 window.addEventListener('storage',e=>{if(e.key===R.KEY)window.dispatchEvent(new CustomEvent('refundchange'));});
})();
