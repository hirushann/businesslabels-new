# Backend Registration API Requirements

This document outlines the API specifications for the registration flow, ensuring compatibility with the `RegisterClient.tsx` frontend component.

## 1. Registration Data Endpoint (Optimized)
Used to populate country and province/state dropdowns.

### GET `/api/register/data`
**Description:** Fetch all registration data (countries and their provinces) in a single request. This eliminates network latency when the user selects a country.

**Frontend integration guide:**
- Fetch this endpoint once when the registration component mounts.
- Store the returned `countries` array in component state.
- Each country must include its own `provinces` array, even if empty.
- When `country_id` changes, derive the province dropdown from `selectedCountry.provinces`; do not make a second request.
- Reset the selected `state_id` / `province_id` whenever the selected country changes.
- `state_id`, `province_id`, and `state` are optional; omit them when the selected country has no province/state requirement.

**Response (200 OK):**
```json
{
  "countries": [
    { 
      "id": "NL", 
      "name": "Netherlands",
      "provinces": [
        { "id": "1", "name": "North Holland" },
        { "id": "2", "name": "South Holland" }
      ]
    },
    { 
      "id": "BE", 
      "name": "Belgium",
      "provinces": [
        { "id": "10", "name": "Antwerp" },
        { "id": "11", "name": "Brussels" }
      ]
    }
  ]
}
```

---

## 2. User Registration Endpoint

### POST `/api/register`
**Description:** Processes the registration form.

**Request Payload:**
The frontend sends the following fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | string | User's primary email address (Required) |
| `first_name` | string | First name (Required) |
| `last_name` | string | Last name (Required) |
| `name` | string | Full name (Usually `first_name` + `last_name`) (Required) |
| `password` | string | Minimum 8 characters recommended (Required) |
| `password_confirmation`| string | Must match `password` (Required) |
| `company` | string | Company name (Optional) |
| `phone` | string | Contact phone number (Required) |
| `billing_email` | string | Specific email for invoices (Required) |
| `country_id` | string | ISO Country Code (e.g., "NL", "BE") (Required) |
| `country` | string | Human-readable country name (Required) |
| `street_address` | string | Street name and house number (Required) |
| `postcode` | string | Postal/Zip code (Required) |
| `city` | string | City name (Required) |
| `state_id` | string | ID of the selected province/state (Optional) |
| `province_id` | string | Duplicate of `state_id` for compatibility (Optional) |
| `state` | string | Human-readable province/state name (Optional) |
| `vat_number` | string | VAT number for business customers (Required) |
| `kvk_number` | string | KVK number (Optional) |

**Example Payload:**
```json
{
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "name": "John Doe",
  "company": "Business Labels B.V.",
  "phone": "0612345678",
  "billing_email": "accounts@example.com",
  "country_id": "NL",
  "country": "Netherlands",
  "street_address": "Hoofdstraat 1",
  "postcode": "1234 AB",
  "city": "Amsterdam",
  "state_id": "1",
  "province_id": "1",
  "state": "North Holland",
  "vat_number": "NL123456789B01",
  "kvk_number": "12345678",
  "password": "securepassword123",
  "password_confirmation": "securepassword123"
}
```

---

## 3. Response Handling

### Success (200 OK or 201 Created)
On success, the backend must return the user object. The frontend will automatically redirect to `/my-account` (or the `redirect` query param).

**Response Body:**
```json
{
  "message": "Account created successfully.",
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Validation Error (422 Unprocessable Entity)
The frontend maps these errors directly to the input fields. The key should match the field name, and the value should be an array of error messages.

**Response Body:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["This email is already registered."],
    "password": ["The password must be at least 8 characters."],
    "street_address": ["The street address field is required."],
    "vat_number": ["Invalid VAT format."]
  }
}
```

### Server Error (500 Internal Server Error)
Generic errors should return a message which will be shown in a toast or form-wide alert.

**Response Body:**
```json
{
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## 4. Post-Registration Behavior
1. **Authentication:** The backend should ideally log the user in immediately after registration (set session/cookie).
2. **Persistence:** The frontend stores the returned `user` object in `localStorage` under `auth_user` for immediate UI updates.
3. **Redirect:** The frontend handles the redirect to `/my-account` upon receiving a successful status code.
