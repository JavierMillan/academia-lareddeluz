/* ============================================================
   video.js · reconoce de dónde viene una grabación
   ------------------------------------------------------------
   Acepta YouTube, Vimeo y Google Drive. En clases.json basta con
   pegar la URL tal como la copias del navegador:

     "grabaciones": [
       { "generacion": "1ª", "fecha": "2026-06-26",
         "url": "https://youtu.be/abc123" }
     ]

   Si mañana cambias un video de Drive a YouTube, se cambia la URL
   y ya: nada de esto hay que tocarlo.
   ============================================================ */
window.DTMMVideo = (function(){
  'use strict';

  /* Cada proveedor sabe reconocer su URL y construir su incrustado. */
  const proveedores = [
    {
      nombre:'YouTube',
      // youtu.be/ID · youtube.com/watch?v=ID · /embed/ID · /live/ID · /shorts/ID
      id: u => (u.match(/(?:youtu\.be\/|v=|\/embed\/|\/live\/|\/shorts\/)([\w-]{11})/)||[])[1],
      embed: id => 'https://www.youtube-nocookie.com/embed/'+id+'?rel=0&modestbranding=1'
    },
    {
      nombre:'Vimeo',
      id: u => (u.match(/vimeo\.com\/(?:video\/)?(\d+)/)||[])[1],
      embed: id => 'https://player.vimeo.com/video/'+id+'?dnt=1'
    },
    {
      nombre:'Drive',
      id: u => (u.match(/drive\.google\.com\/file\/d\/([\w-]+)/)||
                u.match(/drive\.google\.com\/open\?id=([\w-]+)/)||[])[1],
      embed: id => 'https://drive.google.com/file/d/'+id+'/preview'
    }
  ];

  function analizar(url){
    if(!url) return null;
    for(const p of proveedores){
      const id = p.id(url);
      if(id) return {proveedor:p.nombre, id, embed:p.embed(id), original:url};
    }
    return null;   // no reconocido: se ofrece como enlace normal
  }

  /* Devuelve el HTML del reproductor (o de un enlace si no se reconoce). */
  function reproductor(url, titulo){
    const v = analizar(url);
    if(!v){
      return '<a class="video-fallback" href="'+url+'" target="_blank" rel="noopener">'+
             'Abrir la grabación ↗</a>';
    }
    return '<div class="video-marco" data-proveedor="'+v.proveedor.toLowerCase()+'">'+
      '<iframe src="'+v.embed+'" title="'+(titulo||'Grabación de la clase')+'" '+
      'loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" '+
      'allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
  }

  return { analizar, reproductor };
})();
