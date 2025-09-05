(async function(){
  const { loadFirst, deferPageScript } = window.__boot;
  // heic2any + jsPDF (globals)
  await loadFirst(['libs/heic2any/heic2any.min.js','https://unpkg.com/heic2any@0.0.5/dist/heic2any.min.js']);
  await loadFirst(['libs/jspdf/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js']);
  // ffmpeg (module)
  try {
    await window.__boot.loadFirst(['libs/ffmpeg/ffmpeg.min.js','https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/ffmpeg.min.js'], true);
    const mod = await import('libs/ffmpeg/ffmpeg.min.js').catch(()=>import('https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/ffmpeg.min.js'));
    window.createFFmpeg = (opts={}) => mod.createFFmpeg({ corePath: 'libs/ffmpeg/ffmpeg-core.js', ...opts });
    window.fetchFile = mod.fetchFile;
  } catch(e){
    console.warn('FFmpeg module failed to preload; WebP↔GIF will fall back to CDN during use.', e);
  }
  await deferPageScript('js/images.js');
})();