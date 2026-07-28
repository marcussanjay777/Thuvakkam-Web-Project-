import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STUDENT_PORTAL_URL = 'https://superb-fox-9a4107.netlify.app/student-portal'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function acceptanceEmailHtml(name: string, email: string, actionLink: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
    <div style="background:#0E7162;padding:24px 32px;border-radius:8px 8px 0 0;">
      <span style="color:#fff;font-size:20px;font-weight:bold;">Thuvakkam Education — SFS Scholarship</span>
    </div>
    <div style="border:1px solid #E8F5F2;border-top:none;border-radius:0 0 8px 8px;padding:32px;">
      <h2 style="color:#0E7162;margin-top:0;">Congratulations, ${name}!</h2>
      <p style="color:#1A1A1A;font-size:15px;line-height:1.6;">
        You've been accepted into the <strong>Sponsor for Success (SFS)</strong> scholarship program.
        We're excited to support your academic journey.
      </p>
      <p style="color:#1A1A1A;font-size:15px;line-height:1.6;">
        Click below to set up a password for your student portal account (login email: <strong>${email}</strong>),
        where you can share your grades, exam results, and achievements with your sponsor.
      </p>
      <a href="${actionLink}" style="display:inline-block;background:#0E7162;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;margin-top:8px;">Set your password</a>
      <p style="color:#666;font-size:13px;margin-top:28px;">
        This link is single-use and will expire after some time. If you didn't expect this email, contact us at thuvakkam.org.
      </p>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { student_id, student_name, student_email } = await req.json()
    if (!student_id || !student_email) return json({ success: false, error: 'Missing student_id or student_email' })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    // Client scoped to the calling admin's own session — used only to check who's calling
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Not authenticated' }, 401)

    const { data: staffProfile } = await callerClient
      .from('profiles').select('id').eq('id', caller.id).maybeSingle()
    if (!staffProfile) return json({ error: 'Staff access only' }, 403)

    // Admin client — service role key never reaches the browser, only lives here
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 'invite' creates the auth user (pre-confirmed) and returns a one-time link
    // that logs them in and lets them set their own password — no password ever
    // passes through our hands or an email.
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: student_email,
      options: {
        data: { student_id, user_type: 'student' },
        redirectTo: `${STUDENT_PORTAL_URL}/set-password.html`,
      },
    })

    if (linkErr) {
      const already = linkErr.message.toLowerCase().includes('already been registered')
        || linkErr.message.toLowerCase().includes('already registered')
      return json({ success: false, error: already ? 'already_registered' : linkErr.message })
    }

    await adminClient.from('students').update({
      auth_user_id: linkData.user.id,
      student_login_email: student_email,
      credentials_issued_at: new Date().toISOString(),
    }).eq('id', student_id)

    const actionLink = linkData.properties.action_link

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Thuvakkam SFS <onboarding@resend.dev>',
        to: student_email,
        subject: "You've been accepted — Thuvakkam SFS Scholarship",
        html: acceptanceEmailHtml(student_name || 'Student', student_email, actionLink),
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      // Account is created either way — surface the link as a fallback so the admin can share it manually
      return json({ success: true, email_sent: false, action_link: actionLink, warning: errText }, 200)
    }

    return json({ success: true, email_sent: true }, 200)
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) })
  }
})
