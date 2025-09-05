(async function(){
  const { loadFirst, deferPageScript } = window.__boot;
  await loadFirst(['libs/xlsx/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']);
  await loadFirst(['libs/papaparse/papaparse.min.js','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js']);
  await loadFirst(['libs/fit/fit-file-parser.min.js','https://unpkg.com/fit-file-parser@1.11.0/dist/fit-file-parser.min.js']);
  await deferPageScript('js/data.js');
})();