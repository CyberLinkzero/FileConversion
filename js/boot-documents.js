(async function(){
  const { loadFirst, deferPageScript } = window.__boot;
  await loadFirst(['libs/pdf-lib/pdf-lib.min.js','https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js']);
  // pdf.js is imported dynamically inside documents.js; no need to pre-load here.
  await deferPageScript('js/documents.js');
})();