// Thuvakkam SFS Portal — Supabase client
// Shared across all portal pages

const SUPABASE_URL = 'https://vftexybohuaxngyhwjts.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO20BiWyS_VIkhU2DDmw3g_BoGBeCdq';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Redirect to login if no active session, populate topbar, and prompt for name if not set
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }

  // Block donor and student accounts from the committee portal
  const [{ data: donorRow }, { data: studentRow }] = await Promise.all([
    sb.from('donor_accounts').select('id').eq('auth_user_id', session.user.id).maybeSingle(),
    sb.from('students').select('id').eq('auth_user_id', session.user.id).maybeSingle(),
  ]);
  if (donorRow || studentRow) {
    await sb.auth.signOut();
    alert('This account is not authorised for the committee portal.');
    window.location.href = 'index.html';
    return null;
  }

  // Must be a provisioned staff member — a row must already exist in profiles.
  // (New staff are added by an administrator; accounts are NOT auto-promoted.)
  const { data: profile } = await sb
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profile) {
    await sb.auth.signOut();
    alert('This account is not authorised for the committee portal. Please ask an administrator to grant you access.');
    window.location.href = 'index.html';
    return null;
  }

  // If the name is still the email fallback, ask them to set a proper name
  if (profile.full_name === session.user.email) {
    await promptProfileSetup(session.user.id, session.user.email);
    return requireAuth(); // re-run after setup to populate topbar
  }

  const fullName = profile.full_name;
  const role     = profile.role || 'Committee Member';
  const initials = fullName.trim().split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const nameEl   = document.querySelector('.user-name');
  const roleEl   = document.querySelector('.user-role');
  const avatarEl = document.querySelector('.user-avatar');

  if (nameEl)   nameEl.textContent   = fullName;
  if (roleEl)   roleEl.textContent   = role;
  if (avatarEl) avatarEl.textContent = initials;

  initSearch();
  initRealtime();
  return session;
}

/* ── REALTIME — new application notifications ────────────── */
function initRealtime() {
  // Inject notification styles once
  if (!document.getElementById('notif-styles')) {
    const s = document.createElement('style');
    s.id = 'notif-styles';
    s.textContent = `
      #notif-container {
        position: fixed; bottom: 24px; right: 24px;
        display: flex; flex-direction: column; gap: 10px;
        z-index: 9000; pointer-events: none;
      }
      .notif-toast {
        background: #fff; border: 1px solid #EBEBEB;
        border-left: 4px solid #0E7162;
        border-radius: 10px; padding: 14px 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        display: flex; align-items: flex-start; gap: 12px;
        min-width: 300px; max-width: 360px;
        pointer-events: all;
        transform: translateX(120%); opacity: 0;
        transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s;
      }
      .notif-toast.show { transform: translateX(0); opacity: 1; }
      .notif-icon {
        width: 36px; height: 36px; border-radius: 8px;
        background: #E8F5F2; color: #0E7162;
        font-size: 18px; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0;
      }
      .notif-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 3px; }
      .notif-body  { font-size: 12px; color: #666; line-height: 1.5; }
      .notif-actions { display: flex; gap: 8px; margin-top: 10px; }
      .notif-btn-primary {
        font-size: 12px; font-weight: 600; padding: 5px 12px;
        background: #0E7162; color: #fff; border: none;
        border-radius: 5px; cursor: pointer; font-family: inherit;
      }
      .notif-btn-dismiss {
        font-size: 12px; font-weight: 500; padding: 5px 10px;
        background: transparent; color: #999; border: 1px solid #EBEBEB;
        border-radius: 5px; cursor: pointer; font-family: inherit;
      }
      #pending-badge {
        position: absolute; top: -4px; right: -4px;
        background: #FDDB3A; color: #0E7162;
        font-size: 10px; font-weight: 800;
        width: 18px; height: 18px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        line-height: 1;
      }
    `;
    document.head.appendChild(s);
  }

  // Notification container
  if (!document.getElementById('notif-container')) {
    const c = document.createElement('div');
    c.id = 'notif-container';
    document.body.appendChild(c);
  }

  // Update sidebar pending badge
  updatePendingBadge();

  // Subscribe to new student inserts via Supabase Realtime
  sb.channel('new-applications')
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'students',
    }, payload => {
      const s = payload.new;
      showNotification(s);
      updatePendingBadge();

      // If we're on the applications page, add the row live
      if (typeof allStudents !== 'undefined' && document.getElementById('app-tbody')) {
        allStudents.unshift(s);
        applyFilters();
        const counts = ['pending','selected','rejected'].map(st => allStudents.filter(x=>x.status===st).length);
        document.getElementById('count-pending').textContent  = counts[0];
        document.getElementById('count-selected').textContent = counts[1];
        document.getElementById('count-rejected').textContent = counts[2];
        document.getElementById('result-count').textContent   = `(${allStudents.length})`;
      }

      // If we're on the dashboard, refresh metrics
      if (typeof loadDashboard === 'function' && document.getElementById('metric-total')) {
        loadDashboard();
      }
    })
    .subscribe();
}

function showNotification(s) {
  const container = document.getElementById('notif-container');
  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.innerHTML = `
    <div class="notif-icon"><i class="ti ti-user-plus"></i></div>
    <div style="flex:1;">
      <div class="notif-title">New application received</div>
      <div class="notif-body">
        <strong>${s.name}</strong> from ${s.school}, ${s.district} (Class ${s.class}) just applied for SFS 2026.
      </div>
      <div class="notif-actions">
        <button class="notif-btn-primary" onclick="window.location.href='applications.html'">View applications</button>
        <button class="notif-btn-dismiss" onclick="dismissNotif(this)">Dismiss</button>
      </div>
    </div>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  // Auto-dismiss after 12 seconds
  setTimeout(() => dismissNotif(toast.querySelector('.notif-btn-dismiss')), 12000);
}

function dismissNotif(btn) {
  const toast = btn.closest('.notif-toast');
  if (!toast) return;
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 300);
}

async function updatePendingBadge() {
  // Find the Applications nav link and add a badge showing pending count
  const appLink = document.querySelector('a[href="applications.html"]');
  if (!appLink) return;

  const { count } = await sb.from('students')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('cycle_year', 2026);

  // Remove existing badge
  const existing = appLink.querySelector('#pending-badge');
  if (existing) existing.remove();

  if (count && count > 0) {
    appLink.style.position = 'relative';
    const badge = document.createElement('span');
    badge.id = 'pending-badge';
    badge.textContent = count > 99 ? '99+' : count;
    appLink.appendChild(badge);
  }
}

// Show a blocking modal asking the user to enter their name and role
function promptProfileSetup(userId, email) {
  return new Promise(resolve => {
    // Inject modal HTML
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div id="profile-overlay" style="
        position:fixed;inset:0;background:rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="
          background:#fff;border-radius:10px;padding:36px 32px;
          width:100%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.18);
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="font-size:18px;font-weight:700;color:#141413;margin-bottom:6px;">Complete your profile</div>
          <div style="font-size:13px;color:#666;margin-bottom:24px;">Logged in as <strong>${email}</strong>. Please set your name before continuing.</div>
          <div id="profile-error" style="display:none;background:#FEE2E2;border:1px solid #FCA5A5;border-radius:6px;padding:9px 13px;font-size:13px;color:#991B1B;margin-bottom:16px;"></div>
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">Full name</label>
            <input id="profile-name" type="text" placeholder="e.g. Ramesh Kumar"
              style="width:100%;border:1px solid #D8D8D8;border-radius:6px;padding:10px 14px;font-size:14px;outline:none;font-family:inherit;" />
          </div>
          <div style="margin-bottom:24px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">Role</label>
            <select id="profile-role"
              style="width:100%;border:1px solid #D8D8D8;border-radius:6px;padding:10px 14px;font-size:14px;outline:none;font-family:inherit;background:#fff;">
              <option value="Committee Member">Committee Member</option>
              <option value="Donor">Donor</option>
              <option value="Administrator">Administrator</option>
              <option value="Volunteer">Volunteer</option>
            </select>
          </div>
          <button id="profile-save" style="
            width:100%;background:#0E7162;color:#fff;border:none;border-radius:6px;
            padding:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">
            Save and continue
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('profile-name').focus();

    document.getElementById('profile-save').addEventListener('click', async () => {
      const name = document.getElementById('profile-name').value.trim();
      const role = document.getElementById('profile-role').value;
      const errEl = document.getElementById('profile-error');

      if (!name) {
        errEl.textContent = 'Please enter your full name.';
        errEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('profile-save');
      btn.textContent = 'Saving…';
      btn.disabled = true;

      const { error } = await sb.from('profiles').upsert({ id: userId, full_name: name, role });

      if (error) {
        errEl.textContent = 'Could not save profile. Please try again.';
        errEl.style.display = 'block';
        btn.textContent = 'Save and continue';
        btn.disabled = false;
        return;
      }

      modal.remove();
      resolve();
    });
  });
}

// Sign out
async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// Global topbar search — redirects to applications with ?q= param
function initSearch() {
  const input = document.querySelector('.search-input');
  if (!input) return;
  // Pre-fill from URL if coming back from a search
  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) input.value = params.get('q');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) window.location.href = `applications.html?q=${encodeURIComponent(q)}`;
    }
  });
}

// Badge HTML helper
function statusBadge(status) {
  const map = {
    pending:    { cls: 'badge-pending',  label: 'Pending'        },
    selected:   { cls: 'badge-selected', label: 'Selected'       },
    rejected:   { cls: 'badge-rejected', label: 'Not shortlisted'},
    verified:   { cls: 'badge-selected', label: 'Verified'       },
    incomplete: { cls: 'badge-rejected', label: 'Incomplete'     },
  };
  const s = map[status] || { cls: '', label: status };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

// Format date e.g. 2026-05-02 → 02 May 2026
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
