
document.addEventListener('DOMContentLoaded', async ()=>{
 const holder=document.querySelector('[data-nav-placeholder]');
 if(holder){
   const r=await fetch('nav.html');
   holder.innerHTML=await r.text();
 }
 setTimeout(()=>{
   const toggle=document.querySelector('.site-nav__toggle');
   const menu=document.querySelector('.site-nav__menu');
   if(toggle&&menu){
     toggle.onclick=()=>menu.classList.toggle('is-open');
   }
   document.querySelectorAll('.group-button').forEach(btn=>{
      btn.addEventListener('click',e=>{
         e.preventDefault();
         btn.parentElement.classList.toggle('open');
      });
   });
 },200);
});
