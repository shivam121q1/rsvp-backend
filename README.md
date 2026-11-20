# Wed Ease Wedding RSVP Backend API

Fast, lightweight Node.js + TypeScript backend with Prisma ORM designed to store wedding RSVP records from voice bots, webhooks, or frontends. Built for PostgreSQL / Neon DB.

---

## ⚡ Quick Start

### 1. Configure Neon Database URL
Open `.env` (or create one from `.env.example`) and paste your Neon connection string:

```env
PORT=5000
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### 2. Push Schema to Neon DB
Run:
```bash
npm run db:push
```
*(This automatically creates the `wedding_rsvps` table in Neon without manual SQL).*

### 3. Start the Server
- **Development mode:**
  ```bash
  npm run dev
  ```
- **Production build:**
  ```bash
  npm run build
  npm start
  ```

---

## 📡 API Endpoints

### 1. Create / Update Wedding RSVP
- **Method:** `POST`
- **Paths:** `/api/save_wedding_rsvp`, `/api/rsvp`, or `/save_wedding_rsvp`
- **Request Body (supports both camelCase and snake_case):**

```json
{
  "guest_name": "Sharma Ji",
  "attendance": "Yes",
  "guest_count": 3,
  "welcome_drink": "Masala Chai",
  "food_preference": "Vegetarian",
  "room_preference": "Ground floor near elevator",
  "dietary_restrictions": "No garlic",
  "notes": "Need airport pickup around 4 PM",
  "phone_number": "+919876543210",
  "couple_names": "Rishabh & Anjali"
}
```

- **Response (`201 Created` or `200 OK`):**
```json
{
  "success": true,
  "message": "RSVP saved successfully",
  "data": {
    "id": "76495db3-96b0-466d-9653-a178ba7a6f23",
    "guestName": "Sharma Ji",
    "phoneNumber": "+919876543210",
    "attendance": "Yes",
    "guestCount": 3,
    "welcomeDrink": "Masala Chai",
    "foodPreference": "Vegetarian",
    "roomPreference": "Ground floor near elevator",
    "dietaryRestrictions": "No garlic",
    "notes": "Need airport pickup around 4 PM",
    "coupleNames": "Rishabh & Anjali",
    "callId": null,
    "createdAt": "2026-11-20T11:27:00.000Z",
    "updatedAt": "2026-11-20T11:27:00.000Z"
  }
}
```

---

### 2. Get All RSVPs (Guest List)
- **Method:** `GET`
- **Path:** `/api/rsvp`

### 3. Get Single RSVP
- **Method:** `GET`
- **Path:** `/api/rsvp/:id`

### 4. Health Check
- **Method:** `GET`
- **Path:** `/health`

---

## 🛠 Voice Bot Two-Phase Checkpoint Support
The API natively supports voice bot call flows:
1. **Primary Checkpoint:** When the caller confirms attendance (`guest_name`, `attendance`, `guest_count`), pass a `call_id`. The API saves the core record immediately.
2. **Closing Update:** When remaining preferences (`welcome_drink`, `food_preference`, `room_preference`, `notes`) are collected, passing the same `call_id` will update the existing record cleanly without creating duplicates.
