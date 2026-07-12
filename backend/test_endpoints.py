import requests

BASE_URL = "http://localhost:8000"

print("--- STARTING COMPREHENSIVE ENDPOINT VERIFICATION ---")

# 1. Login as Fleet Manager
print("\n[Test 1] Logging in as Fleet Manager...")
fm_payload = {"email": "admin@transitops.com", "password": "admin123"}
fm_response = requests.post(f"{BASE_URL}/auth/login", json=fm_payload)
assert fm_response.status_code == 200
fm_token = fm_response.json()["access_token"]
fm_headers = {"Authorization": f"Bearer {fm_token}"}
print("Success!")

# 2. Login as Dispatcher
print("\n[Test 2] Logging in as Dispatcher...")
disp_payload = {"email": "dispatcher@transitops.com", "password": "dispatcher123"}
disp_response = requests.post(f"{BASE_URL}/auth/login", json=disp_payload)
assert disp_response.status_code == 200
disp_token = disp_response.json()["access_token"]
disp_headers = {"Authorization": f"Bearer {disp_token}"}
print("Success!")

# 3. Create Vehicle (Valid Case)
print("\n[Test 3] Creating valid Vehicle V-900 as Fleet Manager...")
vehicle_payload = {
    "registration_number": "V-900",
    "name": "CargoExpress",
    "type": "Truck",
    "capacity_kg": 15000.0,
    "acquisition_cost": 50000.0,
    "odometer": 120.0,
}
v_create = requests.post(
    f"{BASE_URL}/vehicles", json=vehicle_payload, headers=fm_headers
)
assert v_create.status_code == 201
v_id = v_create.json()["id"]
print(f"Vehicle created with ID: {v_id}")

# 4. Create Vehicle (Duplicate Case -> Expect 400)
print("\n[Test 4] Attempting duplicate Vehicle creation...")
v_dup = requests.post(
    f"{BASE_URL}/vehicles", json=vehicle_payload, headers=fm_headers
)
print(f"Duplicate Status: {v_dup.status_code}, Response: {v_dup.json()}")
assert v_dup.status_code == 400

# 5. Create Vehicle (Pydantic validation failure -> Expect 422)
print("\n[Test 5] Creating Vehicle with missing field (capacity_kg)...")
invalid_payload = {
    "registration_number": "V-901",
    "name": "InvalidCargo",
    "type": "Truck",
    "acquisition_cost": 50000.0,
    "odometer": 120.0,
}
v_inv = requests.post(
    f"{BASE_URL}/vehicles", json=invalid_payload, headers=fm_headers
)
print(f"Validation Error Status: {v_inv.status_code}")
assert v_inv.status_code == 422

# 6. Read Vehicle (Get Single -> Expect 200)
print("\n[Test 6] Getting Single Vehicle V-900...")
v_get = requests.get(f"{BASE_URL}/vehicles/{v_id}", headers=fm_headers)
assert v_get.status_code == 200
assert v_get.json()["registration_number"] == "V-900"
print("Success!")

# 7. Read Vehicle (Non-existent -> Expect 404)
print("\n[Test 7] Getting Non-existent Vehicle (ID 9999)...")
v_notfound = requests.get(f"{BASE_URL}/vehicles/9999", headers=fm_headers)
print(f"Not Found Status: {v_notfound.status_code}")
assert v_notfound.status_code == 404

# 8. List Vehicles with Filters (Type/Status -> Expect 200)
print("\n[Test 8] Listing Vehicles filtered by type=Truck...")
list_trucks = requests.get(
    f"{BASE_URL}/vehicles?type=Truck", headers=fm_headers
)
assert list_trucks.status_code == 200
print(f"Found {len(list_trucks.json())} Trucks.")

# 9. Update Vehicle (Partial Update -> Expect 200)
print("\n[Test 9] Updating Vehicle status to IN_SHOP...")
v_update = requests.patch(
    f"{BASE_URL}/vehicles/{v_id}", json={"status": "In Shop"}, headers=fm_headers
)
assert v_update.status_code == 200
assert v_update.json()["status"] == "In Shop"
print("Success!")

# 10. Update Vehicle (Duplicate registration_number -> Expect 400)
# V-101 is seeded by seed.py
print("\n[Test 10] Updating Vehicle to a registration number that already exists (V-101)...")
v_update_dup = requests.patch(
    f"{BASE_URL}/vehicles/{v_id}",
    json={"registration_number": "V-101"},
    headers=fm_headers,
)
print(f"Update Duplicate Status: {v_update_dup.status_code}")
assert v_update_dup.status_code == 400

# 11. Create Driver (Valid Case)
print("\n[Test 11] Creating valid Driver as Fleet Manager...")
driver_payload = {
    "name": "Charles Leclerc",
    "license_number": "LIC-CL123",
    "license_category": "LMV",
    "contact_number": "+919999999999",
    "license_expiry": "2028-12-31",
    "safety_score": 99.0,
}
d_create = requests.post(
    f"{BASE_URL}/drivers", json=driver_payload, headers=fm_headers
)
assert d_create.status_code == 201
d_id = d_create.json()["id"]
print(f"Driver created with ID: {d_id}")

# 12. Create Driver (Duplicate Case -> Expect 400)
print("\n[Test 12] Attempting duplicate Driver creation...")
d_dup = requests.post(
    f"{BASE_URL}/drivers", json=driver_payload, headers=fm_headers
)
print(f"Duplicate Driver Status: {d_dup.status_code}")
assert d_dup.status_code == 400

# 13. Update Driver (Invalid Status Enum value -> Expect 422)
print("\n[Test 13] Updating Driver with invalid status...")
d_invalid_update = requests.patch(
    f"{BASE_URL}/drivers/{d_id}",
    json={"status": "IN_VACATION"},  # Invalid enum value
    headers=fm_headers,
)
print(f"Invalid Status Update Status: {d_invalid_update.status_code}")
assert d_invalid_update.status_code == 422

# 14. RBAC write checks for Dispatcher (Expect 403)
print("\n[Test 14] Testing Dispatcher writing access (RBAC check)...")
v_rbac = requests.post(
    f"{BASE_URL}/vehicles",
    json={"registration_number": "V-902"},
    headers=disp_headers,
)
d_rbac = requests.patch(
    f"{BASE_URL}/drivers/{d_id}", json={"name": "Dispatcher edit"}, headers=disp_headers
)
print(f"Vehicle Create status: {v_rbac.status_code}, Driver Update status: {d_rbac.status_code}")
assert v_rbac.status_code == 403
assert d_rbac.status_code == 403

# 15. Delete Vehicle and Driver (Cleanup -> Expect 204)
print("\n[Test 15] Cleaning up created test entities...")
del_v = requests.delete(f"{BASE_URL}/vehicles/{v_id}", headers=fm_headers)
del_d = requests.delete(f"{BASE_URL}/drivers/{d_id}", headers=fm_headers)
assert del_v.status_code == 204
assert del_d.status_code == 204
print("Cleanup success!")

# 16. Verify Delete (Expect 404 on deleted resources)
print("\n[Test 16] Verifying resources are deleted (Expect 404)...")
v_del_get = requests.get(f"{BASE_URL}/vehicles/{v_id}", headers=fm_headers)
d_del_get = requests.get(f"{BASE_URL}/drivers/{d_id}", headers=fm_headers)
assert v_del_get.status_code == 404
assert d_del_get.status_code == 404

# 17. Cargo weight limits check on trip creation (Expect 400)
print("\n[Test 17] Attempting to create a Trip with excessive cargo weight...")
# V-101 has capacity_kg = 8000.0, Driver 3 is Available
trip_payload = {
    "trip_code": "TEST-TRIP-OVERWEIGHT",
    "vehicle_id": 1, 
    "driver_id": 3, 
    "source": "City A",
    "destination": "City B",
    "cargo_weight": 50000000000.0, 
    "planned_distance": 100.0,
    "revenue": 2000.0
}
trip_response = requests.post(f"{BASE_URL}/trips", json=trip_payload, headers=disp_headers)
print(f"Excessive cargo trip status: {trip_response.status_code}, detail: {trip_response.json()}")
assert trip_response.status_code == 400
assert "exceeds" in trip_response.json()["detail"].lower()

# 18. Dispatch vehicle/driver that is already busy (Expect 400)
print("\n[Test 18] Attempting to dispatch a Trip with a busy Driver...")
# Driver 2 (Lewis Hamilton) is ON_TRIP. Let's try to dispatch a trip that uses Driver 2.
# Trip 3 (TRIP-003) is seeded as Draft, uses Driver 3 (Available).
# Let's try to temporarily update Trip 3 to use Driver 2, and then dispatch it.
trip3_dispatch_fail = requests.patch(
    f"{BASE_URL}/trips/3", 
    json={"driver_id": 2, "status": "Dispatched"}, 
    headers=disp_headers
)
print(f"Busy dispatch status: {trip3_dispatch_fail.status_code}, detail: {trip3_dispatch_fail.json()}")
assert trip3_dispatch_fail.status_code == 400
assert "cannot be dispatched" in trip3_dispatch_fail.json()["detail"].lower()

# 19. Driver license expiry check (Expect 400)
print("\n[Test 19] Testing Driver with expired license validation...")
# Create a driver whose license is expired
driver_expired_payload = {
    "name": "Expired Driver",
    "license_number": "LIC-EXP11",
    "license_category": "LMV",
    "contact_number": "+910000000000",
    "license_expiry": "2025-01-01", 
    "safety_score": 90.0,
}
d_exp_create = requests.post(f"{BASE_URL}/drivers", json=driver_expired_payload, headers=fm_headers)
assert d_exp_create.status_code == 201
exp_driver_id = d_exp_create.json()["id"]

# Try to create a trip using this expired driver (Expect 400)
trip_exp_driver_payload = {
    "trip_code": "TEST-TRIP-EXPIRED",
    "vehicle_id": 1,
    "driver_id": exp_driver_id,
    "source": "City A",
    "destination": "City B",
    "cargo_weight": 1000.0,
    "planned_distance": 100.0,
    "revenue": 2000.0
}
trip_exp_res = requests.post(f"{BASE_URL}/trips", json=trip_exp_driver_payload, headers=disp_headers)
print(f"Expired driver trip status: {trip_exp_res.status_code}, detail: {trip_exp_res.json()}")
assert trip_exp_res.status_code == 400
assert "expired" in trip_exp_res.json()["detail"].lower()

# Clean up expired driver
del_exp_driver = requests.delete(f"{BASE_URL}/drivers/{exp_driver_id}", headers=fm_headers)
assert del_exp_driver.status_code == 204

print("\n--- ALL COMPREHENSIVE TESTS PASSED SUCCESSFULLY! ---")
