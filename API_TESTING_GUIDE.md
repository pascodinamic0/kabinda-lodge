# API Testing Guide

This guide explains how to test the Next.js API endpoints in the Kabinda Lodge application.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```
   The server typically runs on `http://localhost:3000`

2. **Environment Variables:**
   Ensure you have the following environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, for bypassing RLS)

## Available API Endpoints

### 1. Hotels

#### GET `/api/hotels/get-default`
Get the default hotel ID.

**Example:**
```bash
curl http://localhost:3000/api/hotels/get-default
```

**Response:**
```json
{
  "hotelId": "uuid-here"
}
```

#### POST `/api/hotels/create-default`
Create a default hotel.

**Example:**
```bash
curl -X POST http://localhost:3000/api/hotels/create-default \
  -H "Content-Type: application/json" \
  -d '{"name": "Kabinda Lodge"}'
```

---

### 2. Agents

#### GET `/api/agents`
List all agents for a hotel.

**Query Parameters:**
- `hotel` (required): Hotel ID
- `status` (optional): Filter by status (e.g., "online", "offline")

**Example:**
```bash
curl "http://localhost:3000/api/agents?hotel=YOUR_HOTEL_ID"
```

**With status filter:**
```bash
curl "http://localhost:3000/api/agents?hotel=YOUR_HOTEL_ID&status=online"
```

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Agent Name",
      "hotel_id": "uuid",
      "status": "online",
      "last_seen": "2024-01-01T00:00:00Z",
      "queueLength": 5
    }
  ]
}
```

#### POST `/api/agents/[id]/log`
Log agent activity.

**Example:**
```bash
curl -X POST http://localhost:3000/api/agents/AGENT_ID/log \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "message": "Agent started",
    "metadata": {}
  }'
```

---

### 3. Card Issues

#### GET `/api/card-issues`
List card issues.

**Query Parameters:**
- `hotel` (required if no agent): Hotel ID
- `agent` (required if no hotel): Agent ID
- `status` (optional): Filter by status (e.g., "pending", "completed")
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/card-issues?hotel=YOUR_HOTEL_ID&status=pending"
```

**Response:**
```json
{
  "cardIssues": [
    {
      "id": "uuid",
      "hotel_id": "uuid",
      "room_id": "uuid",
      "booking_id": "uuid",
      "card_type": "guest",
      "status": "pending",
      "payload": {},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/card-issues`
Create a new card issue.

**Example:**
```bash
curl -X POST http://localhost:3000/api/card-issues \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "YOUR_HOTEL_ID",
    "roomId": "ROOM_ID",
    "bookingId": "BOOKING_ID",
    "cardType": "guest",
    "payload": {
      "roomNumber": "101",
      "checkIn": "2024-01-01",
      "checkOut": "2024-01-05"
    },
    "userId": "USER_ID"
  }'
```

#### PATCH `/api/card-issues/[id]/status`
Update card issue status.

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/card-issues/CARD_ISSUE_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completedAt": "2024-01-01T00:00:00Z"
  }'
```

---

### 4. Pairing

#### POST `/api/pairing/generate`
Generate a pairing token for agent registration.

**Authentication:** Requires Bearer token in Authorization header.

**Example:**
```bash
curl -X POST http://localhost:3000/api/pairing/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "agentName": "Agent-001",
    "hotelId": "YOUR_HOTEL_ID"
  }'
```

**Response:**
```json
{
  "pairingToken": "uuid-token",
  "expiresAt": "2024-01-01T00:05:00Z"
}
```

#### POST `/api/pairing/confirm`
Confirm agent pairing with token.

**Example:**
```bash
curl -X POST http://localhost:3000/api/pairing/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "PAIRING_TOKEN",
    "agentId": "AGENT_ID",
    "deviceInfo": {
      "platform": "linux",
      "arch": "x64"
    }
  }'
```

---

### 5. Devices

#### GET `/api/devices`
List devices.

**Query Parameters:**
- `hotel` (required): Hotel ID

**Example:**
```bash
curl "http://localhost:3000/api/devices?hotel=YOUR_HOTEL_ID"
```

---

## Testing Methods

### 1. Using cURL (Command Line)

cURL is the most straightforward way to test APIs. Examples are provided above for each endpoint.

**Basic GET request:**
```bash
curl http://localhost:3000/api/hotels/get-default
```

**POST request with JSON:**
```bash
curl -X POST http://localhost:3000/api/card-issues \
  -H "Content-Type: application/json" \
  -d '{"hotelId": "123", "cardType": "guest", "payload": {}}'
```

**With authentication:**
```bash
curl -X POST http://localhost:3000/api/pairing/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"agentName": "Test", "hotelId": "123"}'
```

### 2. Using Browser (GET requests only)

Simply open the URL in your browser:
```
http://localhost:3000/api/hotels/get-default
```

**Note:** Browsers only support GET requests. For POST/PATCH/DELETE, use other methods.

### 3. Using Postman

1. **Import Collection:**
   - Create a new collection
   - Add requests for each endpoint
   - Set base URL: `http://localhost:3000`

2. **Example Request Setup:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/hotels/get-default`
   - Headers: Add `Content-Type: application/json` for POST requests
   - Authorization: Add `Bearer Token` for protected endpoints

3. **Environment Variables:**
   - Create an environment with:
     - `base_url`: `http://localhost:3000`
     - `hotel_id`: Your hotel ID
     - `auth_token`: Your authentication token

### 4. Using HTTPie

HTTPie provides a more user-friendly CLI interface:

**Install:**
```bash
brew install httpie  # macOS
# or
pip install httpie
```

**Examples:**
```bash
# GET request
http GET http://localhost:3000/api/hotels/get-default

# POST request
http POST http://localhost:3000/api/card-issues \
  hotelId=YOUR_HOTEL_ID \
  cardType=guest \
  payload:='{"roomNumber": "101"}'

# With authentication
http POST http://localhost:3000/api/pairing/generate \
  Authorization:"Bearer YOUR_TOKEN" \
  agentName="Test" \
  hotelId="YOUR_HOTEL_ID"
```

### 5. Using JavaScript/TypeScript (fetch)

You can test endpoints from the browser console or Node.js:

```javascript
// GET request
fetch('http://localhost:3000/api/hotels/get-default')
  .then(res => res.json())
  .then(data => console.log(data));

// POST request
fetch('http://localhost:3000/api/card-issues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    hotelId: 'YOUR_HOTEL_ID',
    cardType: 'guest',
    payload: { roomNumber: '101' }
  })
})
  .then(res => res.json())
  .then(data => console.log(data));

// With authentication
fetch('http://localhost:3000/api/pairing/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    agentName: 'Test',
    hotelId: 'YOUR_HOTEL_ID'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### 6. Using VS Code REST Client Extension

1. Install the "REST Client" extension
2. Create a `.http` or `.rest` file:

```http
### Get default hotel
GET http://localhost:3000/api/hotels/get-default

### List agents
GET http://localhost:3000/api/agents?hotel={{hotelId}}

### Create card issue
POST http://localhost:3000/api/card-issues
Content-Type: application/json

{
  "hotelId": "{{hotelId}}",
  "cardType": "guest",
  "payload": {
    "roomNumber": "101"
  }
}

### Generate pairing token (requires auth)
POST http://localhost:3000/api/pairing/generate
Content-Type: application/json
Authorization: Bearer {{authToken}}

{
  "agentName": "Test Agent",
  "hotelId": "{{hotelId}}"
}
```

3. Click "Send Request" above each request

## Common Issues & Solutions

### 1. CORS Errors
If testing from a different origin, you may need to configure CORS in `next.config.js`.

### 2. Authentication Required
Some endpoints require authentication. Get a token from your Supabase auth:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### 3. Missing Environment Variables
Ensure `.env.local` contains:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 4. RLS (Row Level Security) Errors
If you get permission errors, either:
- Set `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Update RLS policies in Supabase to allow access

### 5. 404 Not Found
- Ensure the dev server is running (`npm run dev`)
- Check the endpoint path matches exactly (case-sensitive)
- Verify the route file exists in `src/app/api/`

## Testing Checklist

- [ ] Dev server is running
- [ ] Environment variables are set
- [ ] Test GET endpoints (no auth required)
- [ ] Test POST endpoints with valid data
- [ ] Test POST endpoints with invalid data (error handling)
- [ ] Test authenticated endpoints with valid token
- [ ] Test authenticated endpoints without token (should fail)
- [ ] Test query parameters
- [ ] Test pagination (limit/offset)
- [ ] Check response status codes
- [ ] Verify response JSON structure

## Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "Testing API Endpoints..."
echo "========================"

# Test 1: Get default hotel
echo -e "\n1. GET /api/hotels/get-default"
curl -s "$BASE_URL/api/hotels/get-default" | jq .

# Test 2: List agents (requires hotel ID)
echo -e "\n2. GET /api/agents"
echo "Note: Requires hotel parameter"
curl -s "$BASE_URL/api/agents?hotel=YOUR_HOTEL_ID" | jq .

# Test 3: List card issues
echo -e "\n3. GET /api/card-issues"
echo "Note: Requires hotel or agent parameter"
curl -s "$BASE_URL/api/card-issues?hotel=YOUR_HOTEL_ID" | jq .

echo -e "\nDone!"
```

Make it executable:
```bash
chmod +x test-api.sh
./test-api.sh
```




