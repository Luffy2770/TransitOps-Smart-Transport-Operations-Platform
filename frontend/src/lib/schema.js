// Mirrors app/core/enums.py and app/models/*.py in the backend repo.
// Keep this in sync if the backend schema changes — every form/table should
// import from here instead of hardcoding field names or enum strings.

export const VEHICLE_STATUS = ['Available', 'On Trip', 'In Shop', 'Retired']
export const DRIVER_STATUS = ['Available', 'On Trip', 'Off Duty', 'Suspended']
export const TRIP_STATUS = ['Draft', 'Dispatched', 'Completed', 'Cancelled']
export const MAINTENANCE_STATUS = ['Active', 'Completed']
export const ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']

// Field names below match SQLAlchemy column names exactly (app/models/*.py),
// so JSON payloads to/from the API can be built without re-guessing keys.

export const VEHICLE_FIELDS = [
  'id',
  'registration_number', // unique
  'name',
  'type',
  'capacity_kg',
  'odometer',
  'acquisition_cost',
  'status', // VEHICLE_STATUS
]

export const DRIVER_FIELDS = [
  'id',
  'name',
  'license_number', // unique
  'license_category',
  'license_expiry', // date
  'contact_number',
  'safety_score',
  'status', // DRIVER_STATUS
]

export const TRIP_FIELDS = [
  'id',
  'source',
  'destination',
  'vehicle_id',
  'driver_id',
  'cargo_weight',
  'planned_distance',
  'status', // TRIP_STATUS
]

export const MAINTENANCE_FIELDS = [
  'id',
  'vehicle_id',
  'service_type',
  'cost',
  'service_date', // date
  'status', // MAINTENANCE_STATUS
]

export const FUEL_LOG_FIELDS = ['id', 'vehicle_id', 'liters', 'cost', 'date']

export const EXPENSE_FIELDS = ['id', 'trip_id', 'vehicle_id', 'toll', 'other']

export const USER_FIELDS = ['id', 'name', 'email', 'role_id', 'is_active']
