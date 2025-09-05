(async function(){
  const { loadFirst, deferPageScript } = window.__boot;
  await loadFirst(['libs/papaparse/papaparse.min.js','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js']);
  await loadFirst(['libs/xlsx/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']);
  // html-docx for DOCX export
  await loadFirst(['libs/html-docx/html-docx.min.js','https://cdn.jsdelivr.net/npm/html-docx-js@0.4.1/dist/html-docx.min.js']);
  await deferPageScript('js/json.js');
})();