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
        // Prefer the filename declared on <body data-page-file="...">, since
        // some hosts (e.g. Cloudflare "clean URLs") strip the .html from the
        // visible URL, which would otherwise make location.pathname wrong.
        var path = document.body.getAttribute('data-page-file');
        if (!path) {
          path = location.pathname.split('/').pop() || 'index.html';
          if (!/\.\w+$/.test(path)) path += '.html';
        }
        getLastCommitDate(path).then(function (date) {
          if (!date || !strong) return;
          strong.textContent = formatUpdated(date);
        });
      }
    }
  });
})();


// ---------------------------------------------------------------------
// Shared behaviour for every video slot across the site (used on
// 3d-work-portfolios.html, addon-dev.html, editing-and-film.html):
//
// Each slot is just a single element with a data attribute —
//   <div class="entry-media" data-video-id="XXXXXXXXXXX"></div>
// — and this script builds the clickable facade (thumbnail + play
// button) into it. No per-video HTML to hand-write or copy-paste.
//
// 1. loadBestThumbnail() fetches the best available YouTube thumbnail,
//    falling back through lower resolutions if a higher one doesn't
//    exist for that video.
// 2. On click, the facade swaps itself for a real YouTube iframe
//    (lazy-load pattern — nothing embeds until clicked).
// 3. If the playing iframe is scrolled fully out of view, it's swapped
//    back to its facade automatically — stops the video without a
//    manual pause button (see the IntersectionObserver below).
// 4. Pressing Esc closes any currently-playing video the same way.

function createVideoFacade(id) {
  var facade = document.createElement('div');
  facade.className = 'video-facade';
  facade.setAttribute('data-video-id', id);
  var playBtn = document.createElement('div');
  playBtn.className = 'play-btn';
  facade.appendChild(playBtn);
  loadBestThumbnail(facade, id);
  attachFacadeClick(facade);
  return facade;
}

function attachFacadeClick(facade) {
  facade.addEventListener('click', function () {
    var id = facade.getAttribute('data-video-id');
    var iframe = document.createElement('iframe');
    iframe.className = 'video-embed';
    iframe.setAttribute('data-video-id', id);
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
    iframe.title = 'YouTube video player';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    facade.replaceWith(iframe);
    if (videoScrollObserver) videoScrollObserver.observe(iframe);
  });
}

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

// ---------------------------------------------------------------------
// Auto-pause on scroll — if a playing video's iframe scrolls completely
// out of view, swap it back to its facade (which stops playback, since
// the iframe itself gets removed from the page).
// ---------------------------------------------------------------------
var videoScrollObserver = ('IntersectionObserver' in window)
  ? new IntersectionObserver(function (items) {
      items.forEach(function (item) {
        if (item.isIntersecting) return;
        var iframe = item.target;
        var id = iframe.getAttribute('data-video-id');
        videoScrollObserver.unobserve(iframe);
        iframe.replaceWith(createVideoFacade(id));
      });
    }, { threshold: 0 })
  : null;

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.entry-media[data-video-id]').forEach(function (slot) {
    var id = slot.getAttribute('data-video-id');
    slot.appendChild(createVideoFacade(id));
  });
});

// ---------------------------------------------------------------------
// #8 Keyboard shortcut: Esc closes any currently-playing video and
// swaps it back to its clickable thumbnail facade.
// ---------------------------------------------------------------------
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('iframe.video-embed').forEach(function (iframe) {
    var id = iframe.getAttribute('data-video-id');
    if (videoScrollObserver) videoScrollObserver.unobserve(iframe);
    iframe.replaceWith(createVideoFacade(id));
  });
});

// ---------------------------------------------------------------------
// Entry category filter — "All / Personal / Commission" buttons above
// the entries list. Only runs on pages that have a ".filter-bar".
// ---------------------------------------------------------------------
(function () {
  var bar = document.querySelector('.filter-bar');
  if (!bar) return;

  var buttons = bar.querySelectorAll('.filter-btn');
  var entries = document.querySelectorAll('.entry[data-category]');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      var filter = btn.getAttribute('data-filter');
      entries.forEach(function (entry) {
        var match = filter === 'all' || entry.getAttribute('data-category') === filter;
        entry.classList.toggle('is-filtered-out', !match);
      });
    });
  });
})();

// ---------------------------------------------------------------------
// Hero viewport shape cycler — alternates between the wireframe cube
// and the wireframe sphere every few seconds (landing page only).
// ---------------------------------------------------------------------
(function () {
  var shapes = document.querySelectorAll('.shape-stage .scene');
  if (shapes.length < 2) return;

  var index = 0;
  setInterval(function () {
    shapes[index].classList.remove('is-active');
    index = (index + 1) % shapes.length;
    shapes[index].classList.add('is-active');
  }, 5000);
})();

// ---------------------------------------------------------------------
// Back to top button — fades in once you've scrolled down a bit,
// click to smooth-scroll back to the top of the page.
// ---------------------------------------------------------------------
(function () {
  var btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.textContent = '↑';
  document.body.appendChild(btn);

  var ticking = false;
  function update() {
    if (window.scrollY > 480) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();

  btn.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });
})();

// ---------------------------------------------------------------------
// #3 Fade-in on scroll — each ".entry" on an article page animates into
// view the first time it crosses into the viewport.
// ---------------------------------------------------------------------
(function () {
  var entries = document.querySelectorAll('.entry');
  if (!entries.length) return;

  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    entries.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }

  var observer = new IntersectionObserver(function (items) {
    items.forEach(function (item) {
      if (item.isIntersecting) {
        item.target.classList.add('in-view');
        observer.unobserve(item.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  entries.forEach(function (el) { observer.observe(el); });
})();

// ---------------------------------------------------------------------
// #1 Lightbox for gallery images — click any ".image-gallery img" to
// view it full-screen, with prev/next and Esc-to-close.
// ---------------------------------------------------------------------
(function () {
  var images = Array.prototype.slice.call(document.querySelectorAll('.image-gallery img'));
  if (!images.length) return;

  var lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML =
    '<div class="lightbox-close">✕ CLOSE</div>' +
    '<div class="lightbox-nav lightbox-prev">‹</div>' +
    '<img src="" alt="">' +
    '<div class="lightbox-nav lightbox-next">›</div>' +
    '<div class="lightbox-caption"></div>';
  document.body.appendChild(lightbox);

  var imgEl = lightbox.querySelector('img');
  var captionEl = lightbox.querySelector('.lightbox-caption');
  var current = 0;

  function show(index) {
    current = (index + images.length) % images.length;
    var src = images[current];
    imgEl.src = src.getAttribute('src');
    imgEl.alt = src.getAttribute('alt') || '';
    var figcaption = src.parentElement.querySelector('figcaption');
    captionEl.textContent = figcaption
      ? figcaption.textContent + '  —  ' + (current + 1) + ' / ' + images.length
      : (current + 1) + ' / ' + images.length;
  }

  function open(index) {
    show(index);
    lightbox.classList.add('open');
  }
  function close() {
    lightbox.classList.remove('open');
  }

  images.forEach(function (img, i) {
    img.addEventListener('click', function () { open(i); });
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', close);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
  lightbox.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();

// ---------------------------------------------------------------------
// Footer copyright year — always reflects the visitor's current year,
// so it never needs a manual edit across all 4 pages every January.
// ---------------------------------------------------------------------
(function () {
  var yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// ---------------------------------------------------------------------
// #10 Typing effect for the hero role line (landing page only).
// Cycles through each role, typing and deleting like a typewriter.
// ---------------------------------------------------------------------
(function () {
  var el = document.getElementById('role-typed');
  if (!el) return;

  var roles = ['3D Artist', 'Product Animation', '3D Generalist', '3D Interior Design', 'Art Director', 'Video Editor'];

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = roles.join(' / ');
    return;
  }

  var roleIndex = 0, charIndex = 0, deleting = false;

  function tick() {
    var word = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = word.slice(0, charIndex);
      if (charIndex === word.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      el.textContent = word.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 65);
  }
  tick();
})();

// ---------------------------------------------------------------------
// Copy email to clipboard — click the "Copy" button next to the email
// link in the Contact section, with brief visual feedback.
// ---------------------------------------------------------------------
(function () {
  document.querySelectorAll('.copy-btn[data-copy-text]').forEach(function (btn) {
    var defaultLabel = btn.textContent;
    var resetTimer = null;

    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy-text');
      if (!navigator.clipboard) return; // mailto link next to it still works as a fallback

      navigator.clipboard.writeText(text).then(function () {
        clearTimeout(resetTimer);
        btn.textContent = 'Copied!';
        btn.classList.add('is-copied');
        resetTimer = setTimeout(function () {
          btn.textContent = defaultLabel;
          btn.classList.remove('is-copied');
        }, 1500);
      }).catch(function () { /* clipboard permission denied — ignore silently */ });
    });
  });
})();

// ---------------------------------------------------------------------
// Progressive image blur-up — gallery images fade in from a soft blur
// to fully sharp once they finish loading, instead of popping in.
// ---------------------------------------------------------------------
(function () {
  document.querySelectorAll('.image-gallery img').forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) return; // already loaded (e.g. from cache) — show as-is
    img.classList.add('is-loading');
    img.addEventListener('load', function () {
      img.classList.remove('is-loading');
    }, { once: true });
    img.addEventListener('error', function () {
      img.classList.remove('is-loading');
    }, { once: true });
  });
})();
