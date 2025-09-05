(async function(){
  // ffmpeg (module)
  try {
    await window.__boot.loadFirst(['libs/ffmpeg/ffmpeg.min.js','https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/ffmpeg.min.js'], true);
    const mod = await import('libs/ffmpeg/ffmpeg.min.js').catch(()=>import('https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/ffmpeg.min.js'));
    window.createFFmpeg = (opts={}) => mod.createFFmpeg({ corePath: 'libs/ffmpeg/ffmpeg-core.js', ...opts });
    window.fetchFile = mod.fetchFile;
  } catch(e){
    console.warn('FFmpeg module failed to preload; video will fall back to CDN during use.', e);
  }
  await window.__boot.deferPageScript('js/video.js');
})();