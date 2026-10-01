import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Powers the committee portal's "Team" page (portal/team.html).
// Only the OWNER login (see OWNER_EMAILS) can call it — other admins can use
// the portal but cannot add, remove or reset anyone.
//   action 'list'   -> everyone with portal access
//   action 'add'    -> give an email portal access + email them a set-password link
//   action 'remove' -> take portal access away (their login itself is kept)
//   action 'reset'  -> email a staff member a fresh set-password link

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PORTAL_URL = 'https://thuvakkamsfs.org/portal'
const ROLES = ['Administrator', 'Committee Member', 'Volunteer']

// The owner login. Only this account can manage the team, and its own access
// can never be removed from the Team page.
const OWNER_EMAILS = ['marcus.sanjay777@gmail.com']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function staffEmailHtml(name: string, email: string, actionLink: string, isReset: boolean) {
  const intro = isReset
    ? 'Here is a link to choose a new password for the committee portal.'
    : "You've been given access to the <strong>Sponsor for Success (SFS)</strong> committee portal, where the team reviews applications and manages students and donors."
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
    <div style="background:#0E7162;padding:24px 32px;border-radius:8px 8px 0 0;">
      <span style="color:#fff;font-size:20px;font-weight:bold;">Thuvakkam Education — SFS Committee Portal</span>
    </div>
    <div style="border:1px solid #E8F5F2;border-top:none;border-radius:0 0 8px 8px;padding:32px;">
      <h2 style="color:#0E7162;margin-top:0;">Hello ${escHtml(name)},</h2>
      <p style="color:#1A1A1A;font-size:15px;line-height:1.6;">${intro}</p>
      <p style="color:#1A1A1A;font-size:15px;line-height:1.6;">
        Your login email is <strong>${escHtml(email)}</strong>. Click below to set your password.
      </p>
      <a href="${actionLink}" style="display:inline-block;background:#0E7162;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;margin-top:8px;">Set your password</a>
      <p style="color:#1A1A1A;font-size:14px;line-height:1.6;margin-top:24px;">
        After that, sign in any time at <a href="${PORTAL_URL}/" style="color:#0E7162;">${PORTAL_URL.replace('https://', '')}/</a>
      </p>
      <p style="color:#666;font-size:13px;margin-top:28px;">
        This link is single-use and expires after some time. If you didn't expect this email, you can ignore it.
      </p>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    // Client scoped to the caller's own session — used only to check who's calling
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Not authenticated' }, 401)

    const { data: callerProfile } = await callerClient
      .from('profiles').select('id').eq('id', caller.id).maybeSingle()
    if (!callerProfile || !OWNER_EMAILS.includes((caller.email || '').toLowerCase())) {
      return json({ success: false, error: 'Only the main admin can manage the team.' }, 403)
    }

    // Admin client — service role key never reaches the browser, only lives here
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json().catch(() => ({}))
    const action = body.action

    async function sendEmail(to: string, name: string, link: string, isReset: boolean) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Thuvakkam SFS <no-reply@thuvakkamsfs.org>',
          to,
          subject: isReset
            ? 'Set a new password — Thuvakkam SFS Committee Portal'
            : "You've been added to the Thuvakkam SFS Committee Portal",
          html: staffEmailHtml(name, to, link, isReset),
        }),
      })
      return res.ok
    }

    // ── LIST ─────────────────────────────────────────────────
    if (action === 'list') {
      const { data: rows, error } = await admin
        .from('profiles').select('id, full_name, role, created_at').order('created_at')
      if (error) return json({ success: false, error: error.message })

      const staff = await Promise.all((rows || []).map(async (p) => {
        const { data } = await admin.auth.admin.getUserById(p.id)
        const email = data?.user?.email || ''
        return {
          id: p.id,
          full_name: p.full_name,
          role: p.role,
          email,
          added_at: p.created_at,
          last_sign_in_at: data?.user?.last_sign_in_at || null,
          is_you: p.id === caller.id,
          is_protected: OWNER_EMAILS.includes(email.toLowerCase()),
        }
      }))
      return json({ success: true, staff })
    }

    // ── ADD ──────────────────────────────────────────────────
    if (action === 'add') {
      const email = String(body.email || '').trim().toLowerCase()
      const fullName = String(body.full_name || '').trim()
      const role = ROLES.includes(body.role) ? body.role : 'Committee Member'

      if (!fullName) return json({ success: false, error: 'Please enter their full name.' })
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ success: false, error: 'Please enter a valid email address.' })
      }

      // New email -> 'invite' creates the login (pre-confirmed) and returns a
      // one-time set-password link. Existing login -> 'recovery' gives a link for
      // the same page. Either way no password passes through our hands.
      const redirectTo = `${PORTAL_URL}/set-password.html`
      let isNewLogin = true
      let { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'invite', email, options: { data: { user_type: 'staff', full_name: fullName }, redirectTo },
      })
      if (linkErr && /already (been )?registered/i.test(linkErr.message)) {
        isNewLogin = false
        ;({ data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: 'recovery', email, options: { redirectTo },
        }))
      }
      if (linkErr || !linkData?.user) {
        return json({ success: false, error: linkErr?.message || 'Could not create the login.' })
      }
      const userId = linkData.user.id

      // The portal blocks donor and student logins, so don't make one of those staff.
      const [{ data: donorRow }, { data: studentRow }, { data: existing }] = await Promise.all([
        admin.from('donor_accounts').select('id').eq('auth_user_id', userId).maybeSingle(),
        admin.from('students').select('id').eq('auth_user_id', userId).maybeSingle(),
        admin.from('profiles').select('id').eq('id', userId).maybeSingle(),
      ])
      if (existing) return json({ success: false, error: 'This email already has portal access.' })
      if (donorRow || studentRow) {
        return json({
          success: false,
          error: `This email is already used by a ${donorRow ? 'donor' : 'student'} account, so it can't also be an admin. Please use a different email.`,
        })
      }

      const { error: insErr } = await admin.from('profiles').insert({ id: userId, full_name: fullName, role })
      if (insErr) return json({ success: false, error: insErr.message })

      const actionLink = linkData.properties.action_link
      const sent = await sendEmail(email, fullName, actionLink, false)
      return json({
        success: true,
        email_sent: sent,
        new_login: isNewLogin,
        // Fallback so the admin can share the link by hand if the email failed
        action_link: sent ? undefined : actionLink,
      })
    }

    // ── REMOVE ───────────────────────────────────────────────
    if (action === 'remove') {
      const userId = String(body.user_id || '')
      if (!userId) return json({ success: false, error: 'Missing user_id' })
      if (userId === caller.id) return json({ success: false, error: "You can't remove your own access." })

      const { data: target } = await admin.auth.admin.getUserById(userId)
      if (OWNER_EMAILS.includes((target?.user?.email || '').toLowerCase())) {
        return json({ success: false, error: 'The main admin account cannot be removed.' })
      }

      const { error } = await admin.from('profiles').delete().eq('id', userId)
      if (error) return json({ success: false, error: error.message })
      return json({ success: true })
    }

    // ── RESET ────────────────────────────────────────────────
    if (action === 'reset') {
      const userId = String(body.user_id || '')
      const { data: p } = await admin.from('profiles').select('full_name').eq('id', userId).maybeSingle()
      if (!p) return json({ success: false, error: 'That person does not have portal access.' })

      const { data: target } = await admin.auth.admin.getUserById(userId)
      const email = target?.user?.email
      if (!email) return json({ success: false, error: 'Could not find their email.' })

      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery', email, options: { redirectTo: `${PORTAL_URL}/set-password.html` },
      })
      if (linkErr || !linkData) return json({ success: false, error: linkErr?.message || 'Could not create the link.' })

      const actionLink = linkData.properties.action_link
      const sent = await sendEmail(email, p.full_name || 'there', actionLink, true)
      return json({ success: true, email_sent: sent, action_link: sent ? undefined : actionLink })
    }

    return json({ success: false, error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) })
  }
})
