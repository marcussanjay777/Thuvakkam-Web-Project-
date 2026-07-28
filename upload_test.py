"""
One-off test: mimic the public apply form's file-upload flow.
Creates a test student, uploads a mock document (a PNG), and saves the
document record — exactly like website/apply.html does, using the anon key.
Then Marcus checks the admin portal (portal/documents.html) to confirm it opens.
"""
import json, time, zlib, struct, urllib.request, urllib.error

SUPABASE_URL = "https://vftexybohuaxngyhwjts.supabase.co"
ANON_KEY = "sb_publishable_vO20BiWyS_VIkhU2DDmw3g_BoGBeCdq"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
}


def post_json(path, payload):
    url = f"{SUPABASE_URL}{path}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    for k, v in HEADERS.items():
        req.add_header(k, v)
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def upload_bytes(path, raw, content_type):
    url = f"{SUPABASE_URL}/storage/v1/object/student-documents/{path}"
    req = urllib.request.Request(url, data=raw, method="POST")
    for k, v in HEADERS.items():
        req.add_header(k, v)
    req.add_header("Content-Type", content_type)
    req.add_header("x-upsert", "false")
    with urllib.request.urlopen(req) as r:
        return r.status


def make_png(width, height):
    """Solid-white image with a green header stripe (brand colour), pure stdlib."""
    def chunk(typ, data):
        body = typ + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter: none
        if y < 60:
            r, g, b = 0x0E, 0x71, 0x62  # green header
        else:
            r, g, b = 0xFF, 0xFF, 0xFF  # white body
        raw += bytes([r, g, b]) * width
    idat = zlib.compress(bytes(raw), 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def main():
    stamp = time.strftime("%Y-%m-%d %H:%M")
    print("1) Creating test student...")
    student = post_json("/rest/v1/students", {
        "name": f"ZZ Upload Test ({stamp})",
        "initials": "UT",
        "email": "arihanthmuthawork@gmail.com",
        "phone": "9999999999",
        "status": "pending",
        "cycle_year": 2026,
        "applied_on": time.strftime("%Y-%m-%d"),
        "notes": "Automated upload test — safe to delete.",
    })
    student_id = student[0]["id"]
    print(f"   student created, id = {student_id}")

    print("2) Uploading mock document (PNG) to storage...")
    png = make_png(600, 400)
    path = f"{student_id}/proof_{int(time.time())}.png"
    status = upload_bytes(path, png, "image/png")
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/student-documents/{path}"
    print(f"   upload HTTP {status}")
    print(f"   public url: {public_url}")

    print("3) Saving document record...")
    doc = post_json("/rest/v1/documents", {
        "student_id": student_id,
        "student_name": f"ZZ Upload Test ({stamp})",
        "type": "Test Document (mock)",
        "file_url": public_url,
        "status": "pending",
        "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    print(f"   document record id = {doc[0]['id']}")
    print("\nDONE. Check portal/documents.html — look for 'ZZ Upload Test'.")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        print(f"HTTP ERROR {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
