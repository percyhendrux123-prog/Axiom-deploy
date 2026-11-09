/* Deploy Axiom: /operator-layer/ brief source tag (A311).
   Local only: no network, no cookies, no storage, no third party.
   Reads utm_source and utm_content from this page's own address and adds them
   to the subject of the brief email, e.g. "Brief: operator layer (linkedin/L1)".
   Without JavaScript the links keep the plain subject "Brief: operator layer". */
(function () {
  'use strict';
  var BASE = 'Brief: operator layer';
  var ADDRESS = 'percy@deployaxiom.com';

  function clean(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 40);
  }

  function subjectFor(search) {
    var params;
    try { params = new URLSearchParams(search || ''); } catch (e) { return BASE; }
    var tags = [clean(params.get('utm_source')), clean(params.get('utm_content'))].filter(Boolean);
    return tags.length ? BASE + ' (' + tags.join('/') + ')' : BASE;
  }

  function hrefFor(subject, body) {
    var href = 'mailto:' + ADDRESS + '?subject=' + encodeURIComponent(subject);
    if (body) href += '&body=' + encodeURIComponent(body);
    return href;
  }

  function bodyOf(href) {
    var match = /[?&]body=([^&]*)/.exec(href || '');
    if (!match) return '';
    try { return decodeURIComponent(match[1]); } catch (e) { return ''; }
  }

  function apply(doc, search) {
    var subject = subjectFor(search);
    var links = doc.querySelectorAll('a[data-brief-mailto]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', hrefFor(subject, bodyOf(links[i].getAttribute('href'))));
    }
    return subject;
  }

  var api = { subjectFor: subjectFor, hrefFor: hrefFor, apply: apply };
  if (typeof window !== 'undefined') window.AXIOM_OPERATOR_LAYER = api;
  if (typeof document !== 'undefined' && typeof location !== 'undefined') apply(document, location.search);
})();
