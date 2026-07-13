// ============================================================
// Thuvakkam SFS Portal — Full Student Profile Panel
// Include this after client.js on any page that needs profiles
// ============================================================

// Inject panel styles once
(function injectStyles() {
  if (document.getElementById('profile-panel-styles')) return;
  const s = document.createElement('style');
  s.id = 'profile-panel-styles';
  s.textContent = `
    #profile-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      z-index: 5000; display: flex; justify-content: flex-end;
      opacity: 0; transition: opacity 0.25s;
    }
    #profile-overlay.open { opacity: 1; }

    #profile-panel {
      width: 100%; max-width: 580px; height: 100%;
      background: #fff; display: flex; flex-direction: column;
      transform: translateX(100%); transition: transform 0.28s cubic-bezier(.4,0,.2,1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }
    #profile-overlay.open #profile-panel { transform: translateX(0); }

    .pp-header {
      background: var(--green-dark, #0E7162);
      padding: 28px 28px 0; flex-shrink: 0;
    }
    .pp-header-top {
      display: flex; align-items: flex-start; gap: 18px; margin-bottom: 24px;
    }
    .pp-avatar {
      width: 60px; height: 60px; border-radius: 12px;
      background: var(--yellow, #FDDB3A);
      color: var(--green-dark, #0E7162);
      font-size: 22px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; letter-spacing: 0.02em;
    }
    .pp-name { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 3px; }
    .pp-school { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
    .pp-close {
      margin-left: auto; width: 34px; height: 34px; border-radius: 8px;
      background: rgba(255,255,255,0.15); border: none; cursor: pointer;
      color: #fff; font-size: 18px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pp-close:hover { background: rgba(255,255,255,0.25); }

    .pp-tabs {
      display: flex; gap: 0; border-top: 1px solid rgba(255,255,255,0.12);
    }
    .pp-tab {
      flex: 1; padding: 12px 8px; font-size: 12px; font-weight: 600;
      color: rgba(255,255,255,0.5); background: transparent; border: none;
      cursor: pointer; border-bottom: 3px solid transparent;
      transition: color 0.15s, border-color 0.15s; letter-spacing: 0.02em;
      font-family: inherit;
    }
    .pp-tab:hover { color: rgba(255,255,255,0.8); }
    .pp-tab.active { color: #fff; border-bottom-color: var(--yellow, #FDDB3A); }

    .pp-body {
      flex: 1; overflow-y: auto; padding: 24px 28px;
      background: #F6F4E6;
    }

    .pp-section { margin-bottom: 20px; }
    .pp-section-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #9E9E9E; margin-bottom: 12px;
    }
    .pp-card {
      background: #fff; border: 1px solid #EBEBEB; border-radius: 10px; overflow: hidden;
    }
    .pp-field {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 13px 16px; border-bottom: 1px solid #F4F4F2; gap: 16px;
    }
    .pp-field:last-child { border-bottom: none; }
    .pp-field-key {
      font-size: 12px; color: #9E9E9E; font-weight: 500; flex-shrink: 0; min-width: 140px;
    }
    .pp-field-val {
      font-size: 13px; color: #1A1A1A; font-weight: 500; text-align: right;
    }
    .pp-field-val.empty { color: #C0C0C0; font-weight: 400; font-style: italic; }

    .pp-footer {
      padding: 16px 28px; background: #fff; border-top: 1px solid #EBEBEB;
      display: flex; gap: 10px; flex-shrink: 0;
    }
    .pp-btn {
      flex: 1; padding: 11px; border-radius: 6px; font-size: 13px;
      font-weight: 600; border: none; cursor: pointer; font-family: inherit;
      transition: opacity 0.15s;
    }
    .pp-btn:hover { opacity: 0.88; }
    .pp-btn-selected  { background: #D1FAE5; color: #065F46; }
    .pp-btn-rejected  { background: #FEE2E2; color: #991B1B; }
    .pp-btn-pending   { background: #FEF3C7; color: #92400E; }

    .pp-status-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; background: #fff;
      border: 1px solid #EBEBEB; border-radius: 10px; margin-bottom: 16px;
    }
    .pp-status-label { font-size: 13px; font-weight: 600; color: #555; }

    .pp-doc-row {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 16px; border-bottom: 1px solid #F4F4F2;
    }
    .pp-doc-row:last-child { border-bottom: none; }
    .pp-doc-icon {
      width: 34px; height: 34px; border-radius: 6px; background: #EBF1EF;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; color: #0E7162; flex-shrink: 0;
    }
    .pp-doc-name { font-size: 13px; font-weight: 500; color: #1A1A1A; }
    .pp-doc-date { font-size: 11px; color: #9E9E9E; margin-top: 2px; }

    .pp-tab-pane { display: none; }
    .pp-tab-pane.active { display: block; }

    .pp-note-area {
      width: 100%; border: 1px solid #D8D8D8; border-radius: 8px;
      padding: 12px 14px; font-size: 13px; font-family: inherit;
      color: #1A1A1A; background: #fff; resize: vertical; min-height: 100px;
      outline: none; box-sizing: border-box;
    }
    .pp-note-area:focus { border-color: #0E7162; }
    .pp-save-note {
      margin-top: 10px; padding: 9px 18px; background: #0E7162; color: #fff;
      border: none; border-radius: 6px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
    }
  `;
  document.head.appendChild(s);
})();

/* ── OPEN PROFILE PANEL ─────────────────────────────────── */
async function openProfile(studentId, context) {
  // Remove any existing panel
  const existing = document.getElementById('profile-overlay');
  if (existing) existing.remove();

  // Fetch full student data from Supabase
  const { data: s, error } = await sb.from('students').select('*').eq('id', studentId).single();
  if (error || !s) { console.error(error); return; }

  // Fetch student documents from Supabase
  const { data: docs } = await sb.from('documents').select('*').eq('student_name', s.name);

  const initials = s.initials || s.name.slice(0, 2).toUpperCase();

  const val = (v, fallback = 'Not provided') =>
    (v !== null && v !== undefined && v !== '')
      ? `<span class="pp-field-val">${v}</span>`
      : `<span class="pp-field-val empty">${fallback}</span>`;

  const iconMap = {
    'Income Certificate':    'ti-certificate',
    'Aadhaar Card':          'ti-id',
    'Marksheet':             'ti-school',
    'Transfer Certificate':  'ti-file-certificate',
    'Community Certificate': 'ti-file-description',
    'Bank Passbook':         'ti-building-bank',
  };

  const statusColors = {
    selected: { bg: '#D1FAE5', txt: '#065F46' },
    pending:  { bg: '#FEF3C7', txt: '#92400E' },
    rejected: { bg: '#FEE2E2', txt: '#991B1B' },
  };
  const sc = statusColors[s.status] || statusColors.pending;
  const statusLabel = { selected: 'Selected', pending: 'Pending review', rejected: 'Not shortlisted' }[s.status];

  const overlay = document.createElement('div');
  overlay.id = 'profile-overlay';
  overlay.innerHTML = `
    <div id="profile-panel">

      <!-- HEADER -->
      <div class="pp-header">
        <div class="pp-header-top">
          <div class="pp-avatar">${initials}</div>
          <div style="flex:1;">
            <div class="pp-name">${s.name}</div>
            <div class="pp-school">${s.school}</div>
            <span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${sc.bg};color:${sc.txt};">${statusLabel}</span>
          </div>
          <button class="pp-close" onclick="closeProfile()"><i class="ti ti-x"></i></button>
        </div>
        <div class="pp-tabs">
          <button class="pp-tab active" data-tab="personal">Personal</button>
          <button class="pp-tab" data-tab="family">Family</button>
          <button class="pp-tab" data-tab="education">Education</button>
          <button class="pp-tab" data-tab="documents">Documents</button>
          <button class="pp-tab" data-tab="notes">Notes</button>
        </div>
      </div>

      <!-- BODY -->
      <div class="pp-body">
        ${context === 'rejected' ? `
        <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:16px;margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#92400E;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <i class="ti ti-alert-triangle" style="font-size:14px;"></i> Rejection reason
          </div>
          <textarea id="pp-rejection-reason" style="width:100%;border:1px solid #FDE68A;border-radius:6px;padding:10px 12px;font-size:13px;font-family:inherit;resize:vertical;min-height:72px;background:#fff;outline:none;box-sizing:border-box;" placeholder="Type the reason this application was rejected...">${s.rejection_reason || ''}</textarea>
          <button onclick="saveRejectionReason('${s.id}')" style="margin-top:8px;padding:7px 16px;background:#92400E;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Save reason</button>
          <span id="pp-reason-saved" style="font-size:12px;color:#065F46;margin-left:10px;display:none;">Saved!</span>
        </div>` : ''}

        <!-- PERSONAL TAB -->
        <div class="pp-tab-pane active" id="tab-personal">
          <div class="pp-section">
            <div class="pp-section-title">Personal information</div>
            <div class="pp-card">
              <div class="pp-field"><span class="pp-field-key">Full name</span>${val(s.name)}</div>
              <div class="pp-field"><span class="pp-field-key">Date of birth</span>${val(s.dob ? fmtDate(s.dob) : null)}</div>
              <div class="pp-field"><span class="pp-field-key">Gender</span>${val(s.gender)}</div>
              <div class="pp-field"><span class="pp-field-key">Aadhaar number</span>${val(s.aadhaar)}</div>
              <div class="pp-field"><span class="pp-field-key">Email</span>${val(s.email)}</div>
              <div class="pp-field"><span class="pp-field-key">Student phone</span>${val(s.student_phone)}</div>
              <div class="pp-field"><span class="pp-field-key">Parent / Guardian phone</span>${val(s.phone)}</div>
              <div class="pp-field"><span class="pp-field-key">Address</span>${val(s.address)}</div>
              <div class="pp-field"><span class="pp-field-key">State</span>${val(s.state)}</div>
            </div>
          </div>
          <div class="pp-section">
            <div class="pp-section-title">Referral</div>
            <div class="pp-card">
              <div class="pp-field"><span class="pp-field-key">Referred by</span>${val(s.referred_by)}</div>
              <div class="pp-field"><span class="pp-field-key">Referrer phone</span>${val(s.referrer_phone)}</div>
            </div>
          </div>
          <div class="pp-section">
            <div class="pp-section-title">Application details</div>
            <div class="pp-card">
              <div class="pp-field"><span class="pp-field-key">Cycle year</span>${val(s.cycle_year)}</div>
              <div class="pp-field"><span class="pp-field-key">Applied on</span>${val(fmtDate(s.applied_on))}</div>
              <div class="pp-field"><span class="pp-field-key">District</span>${val(s.district)}</div>
              <div class="pp-field"><span class="pp-field-key">Mentor assigned</span>${val(s.mentor)}</div>
            </div>
          </div>
        </div>

        <!-- FAMILY TAB -->
        <div class="pp-tab-pane" id="tab-family">
          <div class="pp-section">
            <div class="pp-section-title">Parent / guardian details</div>
            <div class="pp-card">
              <div class="pp-field"><span class="pp-field-key">Father's name</span>${val(s.father_name)}</div>
              <div class="pp-field"><span class="pp-field-key">Mother's name</span>${val(s.mother_name)}</div>
              <div class="pp-field"><span class="pp-field-key">Guardian's name</span>${val(s.guardian_name)}</div>
              <div class="pp-field"><span class="pp-field-key">Parent occupation</span>${val(s.parent_occupation)}</div>
              <div class="pp-field"><span class="pp-field-key">Annual income</span>${val(s.annual_income ? '₹' + Number(s.annual_income).toLocaleString('en-IN') : null)}</div>
              <div class="pp-field"><span class="pp-field-key">No. of siblings</span>${val(s.siblings)}</div>
            </div>
          </div>
          ${s.family_about ? `
          <div class="pp-section">
            <div class="pp-section-title">About the family</div>
            <div class="pp-card">
              <div class="pp-field" style="display:block;padding:14px 16px;">
                <p style="font-size:13px;color:#1A1A1A;line-height:1.7;margin:0;white-space:pre-wrap;">${s.family_about}</p>
              </div>
            </div>
          </div>` : ''}
        </div>

        <!-- EDUCATION TAB -->
        <div class="pp-tab-pane" id="tab-education">
          <div class="pp-section">
            <div class="pp-section-title">Education history</div>
            <div class="pp-card">
              <div class="pp-field" style="display:block;padding:14px 16px;border-bottom:1px solid #F4F4F2;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">10TH STANDARD</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.school_10th || '<span style="color:#C0C0C0;font-style:italic;">Not provided</span>'}</div>
              </div>
              <div class="pp-field" style="display:block;padding:14px 16px;border-bottom:1px solid #F4F4F2;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">12TH / DIPLOMA</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.school_12th || '<span style="color:#C0C0C0;font-style:italic;">Not provided</span>'}</div>
              </div>
              <div class="pp-field" style="display:block;padding:14px 16px;border-bottom:1px solid #F4F4F2;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">U.G. COLLEGE</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.college_ug || '<span style="color:#C0C0C0;font-style:italic;">Not provided</span>'}</div>
              </div>
              <div class="pp-field" style="display:block;padding:14px 16px;border-bottom:1px solid #F4F4F2;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">P.G. COLLEGE</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.college_pg || '<span style="color:#C0C0C0;font-style:italic;">Not provided</span>'}</div>
              </div>
              ${s.other_education ? `
              <div class="pp-field" style="display:block;padding:14px 16px;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">OTHER</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.other_education}</div>
              </div>` : ''}
            </div>
          </div>
          <div class="pp-section">
            <div class="pp-section-title">Scholarship & achievements</div>
            <div class="pp-card">
              <div class="pp-field"><span class="pp-field-key">Other scholarship</span>${val(s.other_scholarship)}</div>
              ${s.scholarship_details ? `<div class="pp-field" style="display:block;padding:14px 16px;border-bottom:1px solid #F4F4F2;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">SCHOLARSHIP DETAILS</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.scholarship_details}</div>
              </div>` : ''}
              <div class="pp-field" style="display:block;padding:14px 16px;border-bottom:1px solid #F4F4F2;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">AWARDS / ACHIEVEMENTS</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.awards || '<span style="color:#C0C0C0;font-style:italic;">Not provided</span>'}</div>
              </div>
              <div class="pp-field" style="display:block;padding:14px 16px;">
                <div style="font-size:11px;color:#9E9E9E;font-weight:600;margin-bottom:4px;">EXTRA-CURRICULAR ACTIVITIES</div>
                <div style="font-size:13px;color:#1A1A1A;white-space:pre-wrap;">${s.extra_curricular || '<span style="color:#C0C0C0;font-style:italic;">Not provided</span>'}</div>
              </div>
            </div>
          </div>
          <div class="pp-section">
            <div class="pp-section-title">Academic performance</div>
            <div class="pp-card">
              <div class="pp-field"><span class="pp-field-key">Previous year %</span>${val(s.prev_percentage ? s.prev_percentage + '%' : null)}</div>
              <div class="pp-field"><span class="pp-field-key">Attendance</span>${val(s.attendance ? s.attendance + '%' : null)}</div>
            </div>
          </div>
          ${s.outcome ? `
          <div class="pp-section">
            <div class="pp-section-title">Post-school outcome</div>
            <div class="pp-card">
              <div class="pp-field"><span class="pp-field-key">Current status</span><span class="pp-field-val" style="color:#0E7162;">${s.outcome}</span></div>
            </div>
          </div>` : ''}
        </div>

        <!-- DOCUMENTS TAB -->
        <div class="pp-tab-pane" id="tab-documents">
          <div class="pp-section">
            <div class="pp-section-title">Submitted documents</div>
            <div class="pp-card">
              ${docs && docs.length ? docs.map(d => `
                <div class="pp-doc-row">
                  <div class="pp-doc-icon"><i class="ti ${iconMap[d.type] || 'ti-file'}"></i></div>
                  <div style="flex:1;">
                    <div class="pp-doc-name">${d.type}</div>
                    <div class="pp-doc-date">Uploaded ${fmtDate(d.uploaded_at)}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="badge ${d.status === 'verified' ? 'badge-selected' : d.status === 'incomplete' ? 'badge-rejected' : 'badge-pending'}" style="font-size:11px;">
                      ${d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                    </span>
                    ${d.file_url ? `<a href="${d.file_url}" target="_blank" style="color:#0E7162;font-size:18px;"><i class="ti ti-download"></i></a>` : ''}
                  </div>
                </div>
              `).join('') : '<div style="padding:16px;text-align:center;color:#9E9E9E;font-size:13px;">No documents uploaded yet.</div>'}
            </div>
          </div>
        </div>

        <!-- NOTES TAB -->
        <div class="pp-tab-pane" id="tab-notes">
          <div class="pp-section">
            <div class="pp-section-title">Committee notes</div>
            <textarea class="pp-note-area" id="pp-notes-input" placeholder="Add internal notes about this student...">${s.notes || ''}</textarea>
            <button class="pp-save-note" onclick="saveNotes('${s.id}')">Save notes</button>
          </div>
        </div>

      </div>

      <!-- FOOTER ACTIONS -->
      <div class="pp-footer">
        ${context === 'selected' ? `
        <button class="pp-btn pp-btn-rejected" style="flex:2;" onclick="removeFromSelected('${s.id}', '${s.name}')">
          <i class="ti ti-user-x" style="margin-right:6px;"></i>Remove from selected
        </button>` : context === 'rejected' ? `
        <button class="pp-btn pp-btn-pending" style="flex:2;" onclick="setProfileStatus('${s.id}', 'pending')">
          <i class="ti ti-rotate" style="margin-right:6px;"></i>Restore to pending
        </button>` : `
        <button class="pp-btn pp-btn-selected"  onclick="setProfileStatus('${s.id}', 'selected')">Mark selected</button>
        <button class="pp-btn pp-btn-pending"   onclick="setProfileStatus('${s.id}', 'pending')">Set pending</button>
        <button class="pp-btn pp-btn-rejected"  onclick="setProfileStatus('${s.id}', 'rejected')">Not shortlisted</button>`}
        <button style="padding:11px 14px;border-radius:6px;border:1px solid #D8D8D8;background:#fff;cursor:pointer;font-family:inherit;color:#555;font-size:13px;" onclick="printProfile('${s.id}')" title="Print / Save as PDF">
          <i class="ti ti-printer"></i>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate open
  requestAnimationFrame(() => overlay.classList.add('open'));

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) closeProfile(); });

  // Tab switching
  overlay.querySelectorAll('.pp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.pp-tab').forEach(b => b.classList.remove('active'));
      overlay.querySelectorAll('.pp-tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

async function removeFromSelected(id, name) {
  if (!confirm(`Remove ${name} from selected? Their status will be set to "Not shortlisted".`)) return;
  const { error } = await sb.from('students').update({ status: 'rejected' }).eq('id', id);
  if (error) { alert('Could not update status.'); return; }
  // Instant local removal — no re-fetch needed
  if (typeof allSelected !== 'undefined') {
    allSelected = allSelected.filter(s => s.id !== id);
    if (typeof renderCards === 'function') renderCards(allSelected);
  }
  closeProfile();
}

function closeProfile() {
  const overlay = document.getElementById('profile-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => overlay.remove(), 280);
}

async function setProfileStatus(id, status) {
  const { error } = await sb.from('students').update({ status }).eq('id', id);
  if (error) { alert('Could not update status.'); return; }

  // Instant local update across whichever page array is active
  for (const arrName of ['allStudents', 'allSelected', 'allRejected']) {
    if (typeof window[arrName] !== 'undefined') {
      const s = window[arrName].find(x => x.id === id);
      if (s) s.status = status;
    }
  }
  if (typeof applyFilters === 'function') applyFilters();
  // Refresh status count chips (applications page)
  ['pending', 'selected', 'rejected'].forEach(st => {
    const el = document.getElementById('count-' + st);
    if (el && typeof allStudents !== 'undefined')
      el.textContent = allStudents.filter(s => s.status === st).length;
  });

  if (status === 'selected') {
    const { data: s } = await sb.from('students')
      .select('id, name, email, auth_user_id').eq('id', id).single();
    if (s && !s.auth_user_id) {
      await generateStudentCredentials(s);
    } else {
      closeProfile();
    }
  } else {
    closeProfile();
  }
}

async function generateStudentCredentials(student) {
  if (!student.email) {
    alert('No email on file for this student — credentials cannot be generated automatically.\nPlease add an email to their profile first.');
    closeProfile();
    return;
  }

  const chars    = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  // Use a separate client instance so the committee member's session is not affected
  const tempSB = supabase.createClient(
    'https://vftexybohuaxngyhwjts.supabase.co',
    'sb_publishable_vO20BiWyS_VIkhU2DDmw3g_BoGBeCdq'
  );

  const { data, error } = await tempSB.auth.signUp({
    email: student.email,
    password,
    options: { data: { student_id: student.id, user_type: 'student' } },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      showCredentialsBanner(student.name, student.email, null, 'Account already exists for this email. Share the original credentials or reset their password.');
    } else {
      alert('Could not generate login credentials: ' + error.message);
      closeProfile();
    }
    return;
  }

  // Link the new auth user back to the student record
  await sb.from('students').update({
    auth_user_id:          data.user.id,
    student_login_email:   student.email,
    credentials_issued_at: new Date().toISOString(),
  }).eq('id', student.id);

  closeProfile();
  showCredentialsBanner(student.name, student.email, password);
}

function showCredentialsBanner(name, email, password, note) {
  const existing = document.getElementById('creds-modal');
  if (existing) existing.remove();

  const credHtml = password ? `
    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:16px 20px;margin-bottom:16px;font-family:monospace;">
      <div style="font-size:12px;color:#166534;font-weight:700;margin-bottom:8px;font-family:inherit;">LOGIN CREDENTIALS</div>
      <div style="font-size:14px;color:#1A1A1A;"><strong>Email:</strong> ${email}</div>
      <div style="font-size:14px;color:#1A1A1A;margin-top:6px;"><strong>Password:</strong> ${password}</div>
    </div>
    <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:16px;">
      Share these credentials securely with <strong>${name}</strong>. They can log in at the Student Portal.<br/>
      <span style="color:#DC2626;font-weight:600;">This password will not be shown again.</span>
    </p>` : `<p style="font-size:13px;color:#555;margin-bottom:16px;">${note}</p>`;

  const modal = document.createElement('div');
  modal.id = 'creds-modal';
  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;">
      <div style="background:#fff;border-radius:12px;width:100%;max-width:460px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);font-family:var(--font);">
        <div style="background:#0E7162;padding:20px 24px;display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:8px;background:#FDDB3A;display:flex;align-items:center;justify-content:center;">
            <i class="ti ti-circle-check" style="font-size:20px;color:#0E7162;"></i>
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:#fff;">${name} marked as selected</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.65);">Student portal credentials ${password ? 'generated' : 'note'}</div>
          </div>
        </div>
        <div style="padding:24px;">
          ${credHtml}
          <div style="display:flex;gap:10px;">
            ${password ? `<button onclick="copyCredentials('${email}','${password}')" style="flex:1;padding:10px;border-radius:6px;border:1px solid #D1D5DB;background:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;color:#374151;">
              <i class="ti ti-copy"></i> Copy credentials
            </button>` : ''}
            <button onclick="document.getElementById('creds-modal').remove()" style="flex:1;padding:10px;border-radius:6px;border:none;background:#0E7162;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function copyCredentials(email, password) {
  navigator.clipboard.writeText(`Student Portal Login\nEmail: ${email}\nPassword: ${password}\nPortal: ${window.location.origin}/student-portal/`);
  const btn = event.target.closest('button');
  btn.innerHTML = '<i class="ti ti-check"></i> Copied!';
  setTimeout(() => btn.innerHTML = '<i class="ti ti-copy"></i> Copy credentials', 2000);
}

async function saveRejectionReason(id) {
  const reason = document.getElementById('pp-rejection-reason').value;
  const { error } = await sb.from('students').update({ rejection_reason: reason }).eq('id', id);
  if (error) { alert('Could not save reason.'); return; }
  // Update local array if on rejected page
  if (typeof allRejected !== 'undefined') {
    const s = allRejected.find(x => x.id === id);
    if (s) { s.rejection_reason = reason; if (typeof renderCards === 'function') renderCards(allRejected); }
  }
  const saved = document.getElementById('pp-reason-saved');
  saved.style.display = 'inline';
  setTimeout(() => saved.style.display = 'none', 2000);
}

async function saveNotes(id) {
  const notes = document.getElementById('pp-notes-input').value;
  const { error } = await sb.from('students').update({ notes }).eq('id', id);
  if (error) { alert('Could not save notes.'); return; }
  const btn = document.querySelector('.pp-save-note');
  btn.textContent = 'Saved!';
  setTimeout(() => btn.textContent = 'Save notes', 1500);
}

/* ── DOCUMENT UPLOAD ────────────────────────────────────── */
async function uploadDoc(studentId, studentName) {
  const typeEl   = document.getElementById('pp-doc-type');
  const fileEl   = document.getElementById('pp-file-input');
  const statusEl = document.getElementById('pp-upload-status');
  const file     = fileEl.files[0];
  const type     = typeEl.value;

  if (!type) { statusEl.textContent = 'Please select a document type.'; statusEl.style.color='#991B1B'; return; }
  if (!file) { statusEl.textContent = 'Please choose a file.'; statusEl.style.color='#991B1B'; return; }

  statusEl.textContent = 'Uploading...';
  statusEl.style.color = '#555';

  // Upload to Supabase Storage (bucket: studen-documents)
  const filePath = `${studentId}/${type.replace(/\s+/g,'-')}_${Date.now()}.${file.name.split('.').pop()}`;
  const { error: uploadError } = await sb.storage.from('studen-documents').upload(filePath, file);

  if (uploadError) {
    statusEl.textContent = 'Upload failed: ' + uploadError.message;
    statusEl.style.color = '#991B1B';
    return;
  }

  // Get public URL
  const { data: urlData } = sb.storage.from('studen-documents').getPublicUrl(filePath);

  // Save record to documents table
  await sb.from('documents').insert({
    student_id:   studentId,
    student_name: studentName,
    type,
    uploaded_at:  new Date().toISOString().slice(0,10),
    status:       'pending',
    file_url:     urlData.publicUrl,
  });

  statusEl.textContent = 'Uploaded successfully!';
  statusEl.style.color = '#065F46';
  fileEl.value = '';
  document.getElementById('pp-file-label').textContent = 'Click to choose a file (PDF, JPG, PNG)';
  typeEl.value = '';

  // Refresh the panel to show new doc
  setTimeout(() => openProfile(studentId), 1000);
}

/* ── PRINT PROFILE ──────────────────────────────────────── */
async function printProfile(id) {
  const { data: s } = await sb.from('students').select('*').eq('id', id).single();
  if (!s) return;
  const { data: docs } = await sb.from('documents').select('*').eq('student_name', s.name);

  const statusLabel = { selected:'Selected', pending:'Pending review', rejected:'Not shortlisted' }[s.status] || s.status;
  const row = (k, v) => `<tr><td style="padding:8px 12px;color:#555;font-size:13px;border-bottom:1px solid #f0f0f0;width:160px;">${k}</td><td style="padding:8px 12px;font-size:13px;font-weight:500;border-bottom:1px solid #f0f0f0;">${v || '<span style="color:#ccc;">Not provided</span>'}</td></tr>`;

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Student Profile — ${s.name}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; color: #1a1a1a; }
      .header { background: #0E7162; padding: 28px 36px; color: #fff; display: flex; align-items: center; gap: 20px; }
      .avatar { width: 56px; height: 56px; border-radius: 10px; background: #FDDB3A; color: #0E7162; font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .name { font-size: 22px; font-weight: 700; } .school { font-size: 13px; opacity: 0.7; margin-top: 4px; }
      .body { padding: 28px 36px; }
      .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0E7162; margin: 24px 0 10px; border-bottom: 2px solid #0E7162; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; background: ${s.status==='selected'?'#D1FAE5':s.status==='rejected'?'#FEE2E2':'#FEF3C7'}; color: ${s.status==='selected'?'#065F46':s.status==='rejected'?'#991B1B':'#92400E'}; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
    </head><body>
    <div class="header">
      <div class="avatar">${s.initials || s.name.slice(0,2).toUpperCase()}</div>
      <div>
        <div class="name">${s.name}</div>
        <div class="school">${s.school} &middot; ${s.district} &middot; Class ${s.class}</div>
      </div>
      <div style="margin-left:auto;"><span class="status-badge">${statusLabel}</span></div>
    </div>
    <div class="body">
      <div class="section-title">Personal information</div>
      <table>${row('Date of birth',s.dob?fmtDate(s.dob):null)}${row('Gender',s.gender)}${row('Aadhaar',s.aadhaar)}${row('Phone',s.phone)}${row('Address',s.address)}</table>
      <div class="section-title">Education</div>
      <table>${row('School',s.school)}${row('Class',s.class)}${row('Board',s.board)}${row('District',s.district)}${row('Previous year %',s.prev_percentage?s.prev_percentage+'%':null)}${row('Attendance',s.attendance?s.attendance+'%':null)}</table>
      <div class="section-title">Family details</div>
      <table>${row("Father's name",s.father_name)}${row("Mother's name",s.mother_name)}${row('Occupation',s.parent_occupation)}${row('Annual income',s.annual_income?'&#8377;'+Number(s.annual_income).toLocaleString('en-IN'):null)}${row('Siblings',s.siblings)}</table>
      <div class="section-title">Application details</div>
      <table>${row('Cycle year',s.cycle_year)}${row('Applied on',fmtDate(s.applied_on))}${row('Status',statusLabel)}</table>
      ${docs&&docs.length?`<div class="section-title">Documents</div><table>${docs.map(d=>`<tr><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f0f0f0;">${d.type}</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f0f0f0;color:#555;">${fmtDate(d.uploaded_at)}</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f0f0f0;font-weight:600;">${d.status}</td></tr>`).join('')}</table>` : ''}
      ${s.notes?`<div class="section-title">Committee notes</div><p style="font-size:13px;color:#555;line-height:1.7;background:#fafafa;padding:14px;border-radius:6px;">${s.notes}</p>`:''}
      <div class="footer">Thuvakkam Education &mdash; SFS Portal &mdash; Printed ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
    </div>
    <script>window.onload=()=>{ window.print(); }<\/script>
    </body></html>
  `);
  win.document.close();
}
