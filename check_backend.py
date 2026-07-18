import json, urllib.request, urllib.error

URL = "https://vftexybohuaxngyhwjts.supabase.co"
KEY = "sb_publishable_vO20BiWyS_VIkhU2DDmw3g_BoGBeCdq"

def req(path, method="GET", body=None, token=None):
    headers = {"apikey": KEY, "Content-Type": "application/json"}
    headers["Authorization"] = "Bearer " + (token or KEY)
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.getcode(), json.loads(resp.read().decode() or "null")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def login(email, password):
    code, res = req("/auth/v1/token?grant_type=password", "POST",
                    {"email": email, "password": password})
    if code == 200 and isinstance(res, dict) and res.get("access_token"):
        return res["access_token"]
    return None

print("=" * 55)
print("BACKEND TESTS")
print("=" * 55)

# 1. Public funded-students RPC (anon)
code, res = req("/rest/v1/rpc/get_public_student_funding", "POST", {})
ok = code == 200 and isinstance(res, list)
print("\n1. Funded-students function (public):",
      "PASS" if ok else "FAIL", "- %d students returned" % (len(res) if ok else 0))

# 2. PRIVACY: anon must NOT read the students table directly
code, res = req("/rest/v1/students?select=id,name", "GET")
blocked = isinstance(res, list) and len(res) == 0
print("2. Anon blocked from reading students table:",
      "PASS (returns empty)" if blocked else "FAIL - got: %s" % str(res)[:80])

# 3. Logins
admin_t   = login("admin@gmail.com", "admin")
student_t = login("teststudent@sfs.com", "Student@123")
donor_t   = login("testdonor@sfs.com", "Donor@123")
print("3. Admin login:  ", "PASS" if admin_t else "FAIL")
print("   Student login:", "PASS" if student_t else "FAIL")
print("   Donor login:  ", "PASS" if donor_t else "FAIL")

# 4. PRIVACY: donor sees only matched students, admin sees all
if donor_t:
    code, dres = req("/rest/v1/students?select=id,name", "GET", token=donor_t)
    dcount = len(dres) if isinstance(dres, list) else -1
else:
    dcount = -1
if admin_t:
    code, ares = req("/rest/v1/students?select=id,name", "GET", token=admin_t)
    acount = len(ares) if isinstance(ares, list) else -1
else:
    acount = -1
print("4. Admin sees all students: %d" % acount)
print("   Donor sees only matched: %d" % dcount,
      "PASS" if (0 <= dcount < acount) else "CHECK")

# 5. Student reads own record only
if student_t:
    code, sres = req("/rest/v1/students?select=id,name", "GET", token=student_t)
    scount = len(sres) if isinstance(sres, list) else -1
    print("5. Student sees only own record: %d" % scount,
          "PASS" if scount == 1 else "CHECK")

# 6. General donations table reachable (admin)
if admin_t:
    code, gd = req("/rest/v1/general_donations?select=id", "GET", token=admin_t)
    print("6. General donations table (admin read):",
          "PASS" if code == 200 else "FAIL")

print("\n" + "=" * 55)
