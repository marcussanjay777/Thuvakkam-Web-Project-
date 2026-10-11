// Education section of the application form.
// The student picks their CURRENT level, and only the matching fields appear
// (10th, then 12th / Diploma, then UG, then PG). Each block is dropdowns + short fields.
//
// The answers are saved into the same database columns as before
// (school_10th, school_12th, college_ug, college_pg, other_education) as one readable line,
// e.g. "Institution: ABC School | Board: CBSE | Year of passing: 2024 | Percentage: 85",
// so the committee portal and donor pages keep working without any database change.
(function () {
  var host = document.getElementById('edu-blocks');
  var levelSel = document.querySelector('select[name="current_level"]');
  if (!host || !levelSel) return;

  var BOARDS = ['State Board (Tamil Nadu)', 'State Board (other state)', 'CBSE', 'ICSE / ISC', 'NIOS',
                'Directorate of Technical Education (Diploma)', 'NCVT / SCVT (ITI)', 'Other'];
  var QUALS  = ['12th standard', 'Diploma', 'ITI'];
  var STATUS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Completed'];
  function years(from, to) { var a = []; for (var y = to; y >= from; y--) a.push(String(y)); return a; }
  var YEARS = years(2005, 2031);

  // Which blocks to show for each level; the last one listed is the student's current level.
  var LEVELS = {
    '9th / 10th standard':          ['tenth'],
    '11th / 12th / Diploma / ITI':  ['tenth', 'hs'],
    'UG (Bachelor\'s degree)':      ['tenth', 'hs', 'ug'],
    'PG (Master\'s degree)':        ['tenth', 'hs', 'ug', 'pg'],
    'Other course':                 ['tenth', 'hs', 'other']
  };

  // ---- Building the fields ----
  function sel(name, label, options, required, extra) {
    var o = '<option value="">Select</option>' + options.map(function (v) { return '<option>' + v + '</option>'; }).join('');
    return '<div class="field-group" data-field="' + name + '"' + (extra || '') + '>' +
      '<label class="field-label">' + label + (required ? ' <span class="req">*</span>' : '') + '</label>' +
      '<select class="field-select" name="' + name + '"' + (required ? ' required' : '') + '>' + o + '</select></div>';
  }
  function txt(name, label, placeholder, required) {
    return '<div class="field-group" data-field="' + name + '">' +
      '<label class="field-label">' + label + (required ? ' <span class="req">*</span>' : '') + '</label>' +
      '<input class="field-input" name="' + name + '" type="text" placeholder="' + placeholder + '"' + (required ? ' required' : '') + ' /></div>';
  }
  function marks(p) {
    return '<div class="form-row">' +
      sel(p + '_marktype', 'Marks type', ['Percentage', 'CGPA'], false) +
      '<div class="field-group" data-field="' + p + '_marks">' +
        '<label class="field-label">Marks <span class="marks-note"></span></label>' +
        '<input class="field-input" name="' + p + '_marks" type="number" inputmode="decimal" min="0" max="100" step="0.01" placeholder="e.g. 85" />' +
      '</div></div>';
  }
  function row(a, b) { return '<div class="form-row">' + a + b + '</div>'; }

  var BLOCKS = {
    tenth: { title: '10th standard', html:
      txt('edu_tenth_name', 'School name', 'Name of your 10th standard school', true) +
      row(sel('edu_tenth_board', 'Board', BOARDS, true),
          sel('edu_tenth_year', '<span class="year-label">Year of passing</span>', YEARS, true)) +
      marks('edu_tenth') },
    hs: { title: '12th / Diploma / ITI', html:
      sel('edu_hs_qual', 'Qualification', QUALS, true) +
      txt('edu_hs_name', 'School / institute name', 'Name of your 12th / Diploma / ITI institution', true) +
      row(sel('edu_hs_board', 'Board', BOARDS, true),
          sel('edu_hs_year', '<span class="year-label">Year of passing</span>', YEARS, true)) +
      marks('edu_hs') },
    ug: { title: 'UG college', html:
      txt('edu_ug_name', 'College name', 'Name of your UG college', true) +
      row(txt('edu_ug_course', 'Course', 'e.g. B.Sc. Computer Science', true),
          txt('edu_ug_univ', 'University', 'e.g. University of Madras', true)) +
      row(sel('edu_ug_joined', 'Year of joining', YEARS, true),
          sel('edu_ug_status', 'Current year of study', STATUS, true)) +
      marks('edu_ug') },
    pg: { title: 'PG college', html:
      txt('edu_pg_name', 'College name', 'Name of your PG college', true) +
      row(txt('edu_pg_course', 'Course', 'e.g. M.Sc. Mathematics', true),
          txt('edu_pg_univ', 'University', 'e.g. Anna University', true)) +
      row(sel('edu_pg_joined', 'Year of joining', YEARS, true),
          sel('edu_pg_status', 'Current year of study', STATUS.slice(0, 3).concat(['Completed']), true)) +
      marks('edu_pg') },
    other: { title: 'Other course', html:
      txt('edu_other_course', 'Course / qualification', 'Name of the course you are doing', true) +
      sel('edu_other_joined', 'Year of joining', YEARS, true) }
  };

  host.innerHTML = Object.keys(BLOCKS).map(function (k) {
    return '<div class="edu-block" data-block="' + k + '" hidden>' +
      '<div class="edu-block-title">' + BLOCKS[k].title + ' <span class="edu-tag"></span></div>' +
      BLOCKS[k].html + '</div>';
  }).join('');

  // ---- Showing the right blocks for the chosen level ----
  var NAME_USES_CURRENT = ['edu_tenth_name', 'edu_hs_name', 'edu_ug_name', 'edu_pg_name'];

  function setField(el, on) {
    el.hidden = !on;
    el.querySelectorAll('input, select').forEach(function (i) { i.disabled = !on; });
  }

  function sync() {
    var list = LEVELS[levelSel.value] || [];
    var current = list[list.length - 1];
    host.querySelectorAll('.edu-block').forEach(function (b) {
      var key = b.getAttribute('data-block');
      var on = list.indexOf(key) !== -1;
      var isCurrent = on && key === current;
      b.hidden = !on;
      b.querySelectorAll('input, select').forEach(function (i) { i.disabled = !on; });
      b.querySelector('.edu-tag').textContent = isCurrent ? '(current)' : (on ? '(completed)' : '');
      b.querySelectorAll('.year-label').forEach(function (l) { l.textContent = isCurrent ? 'Expected year of passing' : 'Year of passing'; });

      // The current institution was already typed above, so don't ask for its name again.
      NAME_USES_CURRENT.forEach(function (n) {
        var f = b.querySelector('[data-field="' + n + '"]');
        if (f) setField(f, on && !isCurrent);
      });
      // Marks are required for finished levels, optional for the one being studied now.
      b.querySelectorAll('[name$="_marks"], [name$="_marktype"]').forEach(function (i) {
        if (isCurrent) i.removeAttribute('required'); else if (on) i.setAttribute('required', '');
      });
      b.querySelectorAll('.marks-note').forEach(function (n) { n.textContent = isCurrent ? '(latest, if available)' : ''; });
    });
  }

  // Marks box limit follows the marks type (100 for percentage, 10 for CGPA)
  host.addEventListener('change', function (e) {
    var t = e.target;
    if (!t.name || !/_marktype$/.test(t.name)) return;
    var m = host.querySelector('[name="' + t.name.replace('_marktype', '_marks') + '"]');
    if (!m) return;
    m.max = t.value === 'CGPA' ? '10' : '100';
    m.placeholder = t.value === 'CGPA' ? 'e.g. 8.5' : 'e.g. 85';
  });

  levelSel.addEventListener('change', sync);
  sync();

  // ---- Reading the answers back ----
  function val(form, name) {
    var el = form.elements[name];
    return el && !el.disabled ? String(el.value || '').trim() : '';
  }
  function line(parts) {
    return parts.filter(function (p) { return p[1]; }).map(function (p) { return p[0] + ': ' + p[1]; }).join(' | ') || null;
  }
  function marksText(form, p) {
    var v = val(form, p + '_marks');
    if (!v) return '';
    return (val(form, p + '_marktype') === 'CGPA') ? v + ' CGPA' : v + '%';
  }

  // Returns the first problem as {name, msg}, or null when every visible field is filled
  window.eduValidate = function (form) {
    if (!levelSel.value) return { name: 'current_level', msg: 'Please select your current level of study.' };
    var all = host.querySelectorAll('[required]:not(:disabled)');
    for (var i = 0; i < all.length; i++) {
      if (!String(all[i].value).trim()) {
        var label = all[i].closest('.field-group').querySelector('.field-label').textContent.replace('*', '').trim();
        var block = all[i].closest('.edu-block').querySelector('.edu-block-title').firstChild.textContent.trim();
        return { name: all[i].name, msg: 'Please fill in "' + label + '" under ' + block + '.' };
      }
    }
    var nums = host.querySelectorAll('input[type="number"]:not(:disabled)');
    for (var j = 0; j < nums.length; j++) {
      var n = nums[j];
      if (n.value !== '' && (Number(n.value) < 0 || Number(n.value) > Number(n.max))) {
        return { name: n.name, msg: 'Marks must be between 0 and ' + n.max + '.' };
      }
    }
    return null;
  };

  // The five text values saved in the database
  window.eduCompose = function (form) {
    var list = LEVELS[levelSel.value] || [];
    var current = list[list.length - 1];
    var school = val(form, 'school');
    function name(block, field) { return current === block ? school : val(form, field); }
    function yearLabel(block) { return current === block ? 'Expected year of passing' : 'Year of passing'; }
    var out = { school_10th: null, school_12th: null, college_ug: null, college_pg: null, other_education: null };

    out.school_10th = line([
      ['Institution', name('tenth', 'edu_tenth_name')], ['Board', val(form, 'edu_tenth_board')],
      [yearLabel('tenth'), val(form, 'edu_tenth_year')], ['Marks', marksText(form, 'edu_tenth')]
    ]);
    if (list.indexOf('hs') !== -1) out.school_12th = line([
      ['Qualification', val(form, 'edu_hs_qual')], ['Institution', name('hs', 'edu_hs_name')],
      ['Board', val(form, 'edu_hs_board')], [yearLabel('hs'), val(form, 'edu_hs_year')],
      ['Marks', marksText(form, 'edu_hs')]
    ]);
    if (list.indexOf('ug') !== -1) out.college_ug = line([
      ['Institution', name('ug', 'edu_ug_name')], ['Course', val(form, 'edu_ug_course')],
      ['University', val(form, 'edu_ug_univ')], ['Year of joining', val(form, 'edu_ug_joined')],
      ['Current year of study', val(form, 'edu_ug_status')], ['Marks', marksText(form, 'edu_ug')]
    ]);
    if (list.indexOf('pg') !== -1) out.college_pg = line([
      ['Institution', name('pg', 'edu_pg_name')], ['Course', val(form, 'edu_pg_course')],
      ['University', val(form, 'edu_pg_univ')], ['Year of joining', val(form, 'edu_pg_joined')],
      ['Current year of study', val(form, 'edu_pg_status')], ['Marks', marksText(form, 'edu_pg')]
    ]);
    out.other_education = line([
      ['Current level', levelSel.value],
      ['Course', val(form, 'edu_other_course')], ['Year of joining', val(form, 'edu_other_joined')]
    ]);
    return out;
  };

  // Called by the page after it restores a saved draft
  window.syncEducation = sync;
})();
