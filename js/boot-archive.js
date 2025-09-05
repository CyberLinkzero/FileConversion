(async function(){
  const { loadFirst, deferPageScript } = window.__boot;
  await loadFirst(['libs/jszip/jszip.min.js','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js']);
  await deferPageScript('js/archive.js');
})();