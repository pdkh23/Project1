"""BRS Reminder API end-to-end tests against public preview URL."""
import os
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --- Auth ---
class TestAuth:
    def test_login_brs_ok(self, s):
        r = s.post(f"{API}/auth/login", json={"user_id": "BRS", "store_code": "1001"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user_id"] == "BRS"
        assert d["display_name"] == "BRS"
        assert "_id" not in d

    def test_login_admin_ok(self, s):
        r = s.post(f"{API}/auth/login", json={"user_id": "ADMIN", "store_code": "9999"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["user_id"] == "ADMIN"

    def test_login_invalid_creds(self, s):
        r = s.post(f"{API}/auth/login", json={"user_id": "BRS", "store_code": "0000"}, timeout=30)
        assert r.status_code == 401

    def test_login_missing_user(self, s):
        r = s.post(f"{API}/auth/login", json={"user_id": "NOPE", "store_code": "1001"}, timeout=30)
        assert r.status_code == 401


# --- Clients CRUD ---
class TestClientsCRUD:
    created_ids: list = []

    def test_create_client(self, s):
        payload = {
            "owner_user_id": "BRS",
            "name": f"TEST_Client_{uuid.uuid4().hex[:6]}",
            "order_number": f"TEST-{uuid.uuid4().hex[:6].upper()}",
            "installation_date": "2026-06-15",
            "order_details": "TEST_AC installation",
        }
        r = s.post(f"{API}/clients", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "_id" not in d
        assert d["name"] == payload["name"]
        assert d["owner_user_id"] == "BRS"
        assert d["id"]
        TestClientsCRUD.created_ids.append(d["id"])

    def test_get_client_after_create(self, s):
        cid = TestClientsCRUD.created_ids[0]
        r = s.get(f"{API}/clients/{cid}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == cid
        assert "_id" not in d

    def test_list_clients_returns_seeded_and_new(self, s):
        r = s.get(f"{API}/clients", params={"owner_user_id": "BRS"}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        for it in items:
            assert "_id" not in it
            assert it["owner_user_id"] == "BRS"

    def test_update_client(self, s):
        cid = TestClientsCRUD.created_ids[0]
        new_name = f"TEST_Updated_{uuid.uuid4().hex[:4]}"
        r = s.put(f"{API}/clients/{cid}", json={"name": new_name}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["name"] == new_name
        # GET to verify persistence
        g = s.get(f"{API}/clients/{cid}", timeout=30).json()
        assert g["name"] == new_name

    def test_search_filters_by_name(self, s):
        # create a uniquely-named client to search for
        unique = f"ZZSEARCH{uuid.uuid4().hex[:6].upper()}"
        c = s.post(f"{API}/clients", json={
            "owner_user_id": "BRS",
            "name": f"TEST_{unique}",
            "order_number": "TEST-SRCH",
            "installation_date": "2026-07-01",
            "order_details": "needle",
        }, timeout=30).json()
        TestClientsCRUD.created_ids.append(c["id"])

        # case-insensitive name match
        r = s.get(f"{API}/clients", params={"owner_user_id": "BRS", "q": unique.lower()}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert any(it["id"] == c["id"] for it in items)

        # match by order_details
        r = s.get(f"{API}/clients", params={"owner_user_id": "BRS", "q": "NEEDLE"}, timeout=30)
        assert any(it["id"] == c["id"] for it in r.json())

    def test_delete_client(self, s):
        # Delete all created
        for cid in TestClientsCRUD.created_ids:
            r = s.delete(f"{API}/clients/{cid}", timeout=30)
            assert r.status_code == 200
            # verify gone
            g = s.get(f"{API}/clients/{cid}", timeout=30)
            assert g.status_code == 404

    def test_get_missing_returns_404(self, s):
        r = s.get(f"{API}/clients/nonexistent-id-xyz", timeout=30)
        assert r.status_code == 404

    def test_update_missing_returns_404(self, s):
        r = s.put(f"{API}/clients/nonexistent-id-xyz", json={"name": "x"}, timeout=30)
        assert r.status_code == 404


# --- Reminders ---
class TestReminders:
    cleanup_ids: list = []

    def test_reminders_only_within_2_days(self, s):
        today = datetime.now(timezone.utc).date()
        in_range_dates = [today.isoformat(), (today + timedelta(days=1)).isoformat(), (today + timedelta(days=2)).isoformat()]
        out_of_range = (today + timedelta(days=10)).isoformat()
        past = (today - timedelta(days=3)).isoformat()

        # seed 1 in-range and 1 out-of-range
        for d in [in_range_dates[1], out_of_range, past]:
            c = s.post(f"{API}/clients", json={
                "owner_user_id": "BRS",
                "name": f"TEST_REM_{uuid.uuid4().hex[:5]}",
                "order_number": f"TEST-{uuid.uuid4().hex[:4].upper()}",
                "installation_date": d,
                "order_details": "TEST_reminder",
            }, timeout=30).json()
            TestReminders.cleanup_ids.append((c["id"], d))

        r = s.get(f"{API}/clients/reminders", params={"owner_user_id": "BRS"}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        for it in items:
            assert "_id" not in it
            assert it["installation_date"] >= today.isoformat()
            assert it["installation_date"] <= (today + timedelta(days=2)).isoformat()

        # make sure our in-range one is present, out-of-range is not
        ids_in_response = {it["id"] for it in items}
        in_range_id = TestReminders.cleanup_ids[0][0]
        out_id = TestReminders.cleanup_ids[1][0]
        past_id = TestReminders.cleanup_ids[2][0]
        assert in_range_id in ids_in_response
        assert out_id not in ids_in_response
        assert past_id not in ids_in_response

    def test_cleanup_reminders(self, s):
        for cid, _ in TestReminders.cleanup_ids:
            s.delete(f"{API}/clients/{cid}", timeout=30)
