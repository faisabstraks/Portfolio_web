// Shared behaviour for every ".video-facade" element across the site
// (used on 3d-work-portfolios.html, addon-dev.html, editing-and-film.html):
//
// 1. If a facade doesn't already have a thumbnail set inline, try to load
//    the best available YouTube thumbnail, falling back through lower
//    resolutions if a higher one doesn't exist for that video.
// 2. On click, swap the facade for a real YouTube iframe (lazy-load
//    pattern, so we don't load every embed up front).

document.querySelectorAll('.video-facade').forEach(function (facade) {
  var id = facade.getAttribute('data-video-id');

  // Only auto-fetch a thumbnail if one hasn't already been set inline
  // (addon-dev.html / editing-and-film.html set theirs manually).
  if (!facade.style.backgroundImage) {
    loadBestThumbnail(facade, id);
  }

  facade.addEventListener('click', function () {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
    iframe.title = 'YouTube video player';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    facade.replaceWith(iframe);
  });
});

function loadBestThumbnail(facade, id) {
  var qualities = ['maxresdefault', 'sddefault', 'hqdefault'];
  var i = 0;
  function tryNext() {
    if (i >= qualities.length) return;
    var img = new Image();
    var url = 'https://img.youtube.com/vi/' + id + '/' + qualities[i] + '.jpg';
    img.onload = function () {
      if (img.naturalWidth === 120 && img.naturalHeight === 90) {
        // YouTube returns a 120x90 placeholder when the requested
        // quality doesn't exist for this video — try the next one down.
        i++; tryNext();
      } else {
        facade.style.backgroundImage = 'url(' + url + ')';
      }
    };
    img.onerror = function () { i++; tryNext(); };
    img.src = url;
  }
  tryNext();
}
