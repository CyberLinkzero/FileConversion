
(function(){
  function ensureCss(){
    if(!document.querySelector('link[href$="nav.css"]')){
      var l=document.createElement('link'); l.rel='stylesheet'; l.href='nav.css'; document.head.appendChild(l);
    }
  }
  function getNav(){return document.getElementById('fc-site-nav') || document.querySelector('.site-nav');}
  function groups(nav){return Array.prototype.slice.call(nav.querySelectorAll('.site-nav__group,.tab-group'));}
  function buttons(nav){return Array.prototype.slice.call(nav.querySelectorAll('.site-nav__button,.group-button'));}
  function dropdownFor(group){return group.querySelector('.site-nav__dropdown,.dropdown');}
  function closeAll(nav){
    groups(nav).forEach(function(g){g.classList.remove('open');});
    buttons(nav).forEach(function(b){b.setAttribute('aria-expanded','false');});
  }
  function openGroup(nav,group){
    closeAll(nav);
    group.classList.add('open');
    var b=group.querySelector('.site-nav__button,.group-button');
    if(b) b.setAttribute('aria-expanded','true');
  }
  function initNav(){
    ensureCss();
    var nav=getNav();
    if(!nav || nav.dataset.ready==='1') return;
    nav.dataset.ready='1';
    var menu=nav.querySelector('.site-nav__menu,#site-nav-menu');
    var toggle=nav.querySelector('.site-nav__toggle');
    var path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    nav.querySelectorAll('a[href]').forEach(function(a){
      var href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();
      if(href===path) a.classList.add('active');
    });
    closeAll(nav);
    if(toggle&&menu){
      toggle.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        var open=menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded',open?'true':'false');
        if(!open) closeAll(nav);
      });
    }
    nav.addEventListener('click',function(e){
      var btn=e.target.closest && e.target.closest('.site-nav__button,.group-button');
      if(!btn || !nav.contains(btn)) return;
      e.preventDefault(); e.stopPropagation();
      var group=btn.closest('.site-nav__group,.tab-group');
      if(!group) return;
      if(group.classList.contains('open')) closeAll(nav); else openGroup(nav,group);
    });
    document.addEventListener('click',function(e){ if(!nav.contains(e.target)) closeAll(nav); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeAll(nav); });
  }
  function loadNav(){
    ensureCss();
    var placeholder=document.querySelector('[data-nav-placeholder]');
    if(!placeholder){ initNav(); return; }
    fetch('nav.html',{cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('Failed to load nav.html'); return r.text(); })
      .then(function(html){ placeholder.outerHTML=html; initNav(); })
      .catch(function(err){ console.error('Nav load error:',err); placeholder.outerHTML='<nav class="site-nav" id="fc-site-nav" aria-label="Primary Navigation">\n  <div class="site-nav__inner">\n    <a class="site-nav__brand" href="index.html" aria-label="FileConverter home">\n      <span class="site-nav__logo">FC</span>\n      <span class="site-nav__brand-text">\n        <strong>FileConverter.run</strong>\n        <small>Private browser tools</small>\n      </span>\n    </a>\n\n    <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-nav-menu">\n      <span></span><span></span><span></span>\n      <span class="site-nav__toggle-text">Menu</span>\n    </button>\n\n    <div class="site-nav__menu" id="site-nav-menu">\n      <a class="site-nav__link" href="index.html">Home</a>\n\n      <div class="site-nav__group">\n        <button class="site-nav__link site-nav__button" type="button" aria-expanded="false">File Tools ▾</button>\n        <div class="site-nav__dropdown">\n          <a href="images.html">Images</a>\n          <a href="audio.html">Audio</a>\n          <a href="video.html">Video</a>\n          <a href="pdf.html">PDF</a>\n          <a href="docx.html">DOCX</a>\n          <a href="json.html">JSON</a>\n          <a href="data.html">CSV / XLSX / GPS Data</a>\n          <a href="archive.html">ZIP Tools</a>\n          <a href="background_remover.html">Image Editor / Background Remover</a>\n          <a href="gps.html">GPS Tools</a>\n        </div>\n      </div>\n\n      <div class="site-nav__group">\n        <button class="site-nav__link site-nav__button" type="button" aria-expanded="false">Guides ▾</button>\n        <div class="site-nav__dropdown">\n          <a href="gps-file-guide.html">GPS Guide</a>\n          <a href="choosing-the-right-file-type.html">File Type Guide</a>\n          <a href="image-file-guide.html">Image Guide</a>\n          <a href="audio-file-guide.html">Audio Guide</a>\n          <a href="video-file-guide.html">Video Guide</a>\n          <a href="how-to-convert-csv-to-json.html">CSV to JSON Guide</a>\n          <a href="how-to-convert-json-to-csv.html">JSON to CSV Guide</a>\n          <a href="how-to-convert-pdf-to-word.html">PDF to Word Guide</a>\n          <a href="how-to-convert-word-to-pdf.html">Word to PDF Guide</a>\n        </div>\n      </div>\n\n      <div class="site-nav__group">\n        <button class="site-nav__link site-nav__button" type="button" aria-expanded="false">Software ▾</button>\n        <div class="site-nav__dropdown">\n          <a href="graze-inventory-console.html">GrazeCart Inventory Console</a>\n          <a href="cyberchat.html">Cyber Chat</a>\n          <a href="Music.html">Music Tools</a>\n          <a href="programming.html">Programming Lab</a>\n          <a href="cyber-clean.html">Cyber Clean</a>\n          <a href="Alyssas_Party_Planner.html">Alyssa\'s Party Planner</a>\n        </div>\n      </div>\n\n      <div class="site-nav__group">\n        <button class="site-nav__link site-nav__button" type="button" aria-expanded="false">Games ▾</button>\n        <div class="site-nav__dropdown">\n          <a href="Cyberpets.html">Cyber Pets</a>\n          <a href="cyber-chess.html">Cyber Chess</a>\n          <a href="compression-puzzle.html">Compression Puzzle</a>\n          <a href="bsnes-emulator.html">Cyber SNES Emulator</a>\n        </div>\n      </div>\n\n      <a class="site-nav__cta" href="index.html#launcher">Convert Now</a>\n    </div>\n  </div>\n</nav>'; initNav(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadNav); else loadNav();
})();
