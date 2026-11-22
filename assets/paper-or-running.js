// Paper or running? Scores in the browser. Nothing is sent or stored.
(function () {
  var form = document.getElementById('por-form');
  if (!form) return;
  var AREAS = {
    follow: { name: 'Follow-through', qs: ['q4', 'q7'],
      rule: 'Following up depends on someone remembering to do it.',
      step: 'Pick the question customers ask most after hours. Write the answer once, set your inbox or phone to send it on its own tonight, and read what came in each morning.' },
    continuity: { name: 'Continuity', qs: ['q5', 'q9'],
      rule: 'Work stops when one person does.',
      step: 'List the three things only one person knows how to do. This week, have them write the steps while they do each one, once. Next time they are out, someone else follows the list.' },
    memory: { name: 'Memory', qs: ['q6'],
      rule: 'How the work gets done lives in a head, not in something that runs.',
      step: 'Take one task you handle every day. Write down when it happens, what done looks like, and who checks it. A rule written that plainly is one step from running on its own.' },
    catch: { name: 'Catching mistakes', qs: ['q8'],
      rule: 'Customers find the mistakes before you do.',
      step: 'Take the last mistake a customer caught. Add one check that would have caught it first, with a set time and a named person: every Friday at 4, one person reads the open jobs.' }
  };
  var ORDER = ['follow', 'continuity', 'memory', 'catch'];
  function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  function band(s) { return s < 40 ? 'On paper' : (s < 70 ? 'Half running' : 'Running'); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var required = ['q1','q2','q4','q5','q6','q7','q8','q9','q10'];
    var missing = required.filter(function (n) { return val(n) === null; });
    var warn = document.getElementById('por-missing');
    if (missing.length) {
      warn.hidden = false;
      var first = form.querySelector('input[name="' + missing[0] + '"]');
      if (first) first.focus();
      return;
    }
    warn.hidden = true;
    var scores = {}, total = 0;
    ORDER.forEach(function (k) {
      var qs = AREAS[k].qs, sum = 0;
      qs.forEach(function (q) { sum += Number(val(q)); });
      scores[k] = Math.round(sum / (qs.length * 2) * 100);
      total += scores[k];
    });
    var overall = Math.round(total / ORDER.length);
    var low = ORDER.slice().sort(function (a, b) { return scores[a] - scores[b]; })[0];
    var wish = val('q10');
    var pick = scores[wish] <= scores[low] + 25 ? wish : low;
    document.getElementById('por-band').textContent = overall + ' of 100: ' + band(overall);
    var bars = document.getElementById('por-bars');
    bars.textContent = '';
    ORDER.forEach(function (k) {
      var li = document.createElement('li');
      var lab = document.createElement('span'); lab.className = 'por-label';
      var a = document.createElement('span'); a.textContent = AREAS[k].name;
      var b = document.createElement('span'); b.textContent = scores[k] + ' · ' + band(scores[k]);
      lab.appendChild(a); lab.appendChild(b);
      var tr = document.createElement('span'); tr.className = 'por-track';
      var fi = document.createElement('span'); fi.className = 'por-fill';
      fi.setAttribute('data-w', scores[k]);
      tr.appendChild(fi); li.appendChild(lab); li.appendChild(tr); bars.appendChild(li);
      fi.style.width = scores[k] + '%';
    });
    var said = (form.querySelector('textarea[name="q3"]').value || '').trim().replace(/[.!?]+$/, '');
    var rule = AREAS[pick].rule;
    if (said) rule += ' You named it yourself: \u201c' + said + '.\u201d';
    document.getElementById('por-rule').textContent = rule;
    document.getElementById('por-step').textContent = AREAS[pick].step;
    var res = document.getElementById('por-result');
    res.hidden = false; form.hidden = true; res.focus(); res.scrollIntoView({ block: 'start' });
  });
  document.getElementById('por-again').addEventListener('click', function () {
    form.reset(); form.hidden = false; document.getElementById('por-result').hidden = true;
    window.scrollTo(0, 0);
  });
})();
