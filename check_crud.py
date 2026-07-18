import json, urllib.request, urllib.error, datetime

URL = "https://vftexybohuaxngyhwjts.supabase.co"
KEY = "sb_publishable_vO20BiWyS_VIkhU2DDmw3g_BoGBeCdq"

def req(path, method="GET", body=None, token=None, prefer=None):
    headers = {"apikey": KEY, "Content-Type": "application/json",
               "Authorization": "Bearer " + (token or KEY)}
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            raw = resp.read().decode()
            return resp.getcode(), (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def login(email, pw):
    c, r = req("/auth/v1/token?grant_type=password", "POST", {"email": email, "password": pw})
    return r.get("access_token") if isinstance(r, dict) else None

admin = login("admin@gmail.com", "admin")
student = login("teststudent@sfs.com", "Student@123")

print("=" * 55)
print("CRUD TESTS (reversible — no junk data left behind)")
print("=" * 55)

# ---- UPDATE on students (admin), then revert ----
code, rows = req("/rest/v1/students?select=id,notes&student_login_email=eq.teststudent@sfs.com",
                 token=admin)
if not rows:
    code, rows = req("/rest/v1/students?select=id,notes&limit=1", token=admin)
sid = rows[0]["id"]
original = rows[0].get("notes")
stamp = "QA-TEST-" + datetime.datetime.now().strftime("%H%M%S")

code, _ = req("/rest/v1/students?id=eq." + sid, "PATCH", {"notes": stamp},
              token=admin, prefer="return=minimal")
code, chk = req("/rest/v1/students?select=notes&id=eq." + sid, token=admin)
updated_ok = chk and chk[0]["notes"] == stamp
# revert
req("/rest/v1/students?id=eq." + sid, "PATCH", {"notes": original},
    token=admin, prefer="return=minimal")
code, chk2 = req("/rest/v1/students?select=notes&id=eq." + sid, token=admin)
reverted_ok = chk2 and chk2[0]["notes"] == original
print("\nUPDATE student record (admin):", "PASS" if updated_ok else "FAIL")
print("REVERT change (clean up):     ", "PASS" if reverted_ok else "FAIL")

# ---- CREATE + READ + DELETE on student_updates (student) ----
code, myrow = req("/rest/v1/students?select=id", token=student)
my_sid = myrow[0]["id"] if myrow else None
today = datetime.date.today().isoformat()
new_update = {"student_id": my_sid, "category": "other",
              "title": "QA automated test entry", "description": "temporary - will be deleted",
              "record_date": today}
code, created = req("/rest/v1/student_updates", "POST", new_update,
                    token=student, prefer="return=representation")
create_ok = code in (200, 201) and isinstance(created, list) and created
new_id = created[0]["id"] if create_ok else None
print("\nCREATE academic update (student):", "PASS" if create_ok else "FAIL - %s" % str(created)[:80])

if new_id:
    code, readback = req("/rest/v1/student_updates?select=title&id=eq." + new_id, token=student)
    read_ok = readback and readback[0]["title"] == "QA automated test entry"
    print("READ it back:                    ", "PASS" if read_ok else "FAIL")

    code, _ = req("/rest/v1/student_updates?id=eq." + new_id, "DELETE",
                  token=student, prefer="return=minimal")
    code, gone = req("/rest/v1/student_updates?select=id&id=eq." + new_id, token=student)
    delete_ok = gone == []
    print("DELETE it (clean up):            ", "PASS" if delete_ok else "FAIL")

print("\n" + "=" * 55)
