// ---------------------------------------------------------------------
// Real "last updated" info pulled from this repo's GitHub commit history.
// Works on:
//  - index.html: each portfolio card shows the last commit date of the
//    page it links to.
//  - the article pages themselves: the "UPDATE:" field shows the last
//    commit date of that page's own HTML file.
// ---------------------------------------------------------------------
(function () {
  var GH_OWNER = 'faisabstraks';
  var GH_REPO = 'Portfolio_web';
  var GH_BRANCH = 'main';
  var CACHE_TTL = 60 * 60 * 1000; // 1 hour, so repeat visits don't spam the API

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatUpdated(dateStr) {
    var date = new Date(dateStr);
    var now = new Date();
    var time = pad2(date.getHours()) + ':' + pad2(date.getMinutes());

    var dayMs = 86400000;
    var today = startOfDay(now);
    var thatDay = startOfDay(date);
    var diffDays = Math.round((today.getTime() - thatDay.getTime()) / dayMs);

    if (diffDays <= 0) return 'today at ' + time;
    if (diffDays === 1) return 'yesterday at ' + time;
    if (diffDays < 30) return diffDays + ' days ago at ' + time;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' at ' + time;
  }

  function getLastCommitDate(path) {
    var cacheKey = 'gh-last-commit:' + path;
    try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL) {
        return Promise.resolve(cached.date);
      }
    } catch (e) { /* sessionStorage unavailable — just skip the cache */ }

    var url = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO +
      '/commits?path=' + encodeURIComponent(path) + '&sha=' + GH_BRANCH + '&per_page=1';

    return fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || !data.length) return null;
        var date = data[0].commit.committer.date;
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ date: date, fetchedAt: Date.now() }));
        } catch (e) { /* ignore quota/availability errors */ }
        return date;
      })
      .catch(function () { return null; }); // network/API error — leave the fallback text as-is
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Homepage cards: each links to the page whose commit history we want.
    document.querySelectorAll('.clip').forEach(function (clip) {
      var meta = clip.querySelector('.clip-meta');
      var href = clip.getAttribute('href');
      if (!meta || !href) return;
      getLastCommitDate(href).then(function (date) {
        if (!date) return;
        meta.textContent = 'LAST UPDATE: ' + formatUpdated(date).toUpperCase();
      });
    });

    // Article pages: the "UPDATE:" field describes this very file.
    var metaRow = document.querySelector('.article-meta-row');
    if (metaRow) {
      var updateField = Array.prototype.find.call(metaRow.querySelectorAll('span'), function (span) {
        return span.textContent.trim().indexOf('UPDATE:') === 0;
      });
      if (updateField) {
        var strong = updateField.querySelector('strong');
        var path = location.pathname.split('/').pop() || 'index.html';
        getLastCommitDate(path).then(function (date) {
          if (!date || !strong) return;
          strong.textContent = formatUpdated(date);
        });
      }
    }
  });
})();


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
