import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req: Request, res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n================== [${timestamp}] ==================`);
  console.log(`📥 INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
  if (req.method !== "GET") {
    console.log("📦 PAYLOAD (req.body):", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Exact payload sent by the voice bot tool (save_wedding_rsvp)
interface RSVPPayload {
  guest_name?: string;
  attendance?: string;
  guest_count?: number | string;
  welcome_drink?: string;
  food_preference?: string;
  room_preference?: string;
  dietary_restrictions?: string;
  notes?: string;
}

// POST endpoint to store the RSVP
app.post("/api/save_wedding_rsvp", async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log("\n🎯 Processing 'save_wedding_rsvp' tool call...");

  try {
    const {
      guest_name,
      attendance,
      guest_count,
      welcome_drink,
      food_preference,
      room_preference,
      dietary_restrictions,
      notes,
    }: RSVPPayload = req.body;

    console.log("🔍 Validating received fields:");
    console.log(`   - guest_name: "${guest_name}"`);
    console.log(`   - attendance: "${attendance}"`);
    console.log(`   - guest_count: ${guest_count}`);
    console.log(`   - welcome_drink: "${welcome_drink}"`);
    console.log(`   - food_preference: "${food_preference}"`);
    console.log(`   - room_preference: "${room_preference}"`);
    console.log(`   - dietary_restrictions: "${dietary_restrictions}"`);
    console.log(`   - notes: "${notes}"`);

    if (!guest_name || typeof guest_name !== "string" || !guest_name.trim()) {
      console.warn("⚠️ Validation Failed: Missing or empty 'guest_name'");
      return res.status(400).json({
        success: false,
        error: "guest_name is required",
      });
    }

    const attendanceStatus = (attendance || "Yes").trim();
    const parsedCount = parseInt(String(guest_count), 10);
    const count = isNaN(parsedCount)
      ? attendanceStatus.toLowerCase() === "no"
        ? 0
        : 1
      : parsedCount;

    console.log("💾 Writing record to Database via Prisma...");
    const record = await prisma.weddingRSVP.create({
      data: {
        guestName: guest_name.trim(),
        attendance: attendanceStatus,
        guestCount: count,
        welcomeDrink: welcome_drink || null,
        foodPreference: food_preference || null,
        roomPreference: room_preference || null,
        dietaryRestrictions: dietary_restrictions || null,
        notes: notes || null,
      },
    });

    const durationMs = Date.now() - startTime;
    console.log(`✅ [SUCCESS] RSVP saved to DB in ${durationMs}ms:`);
    console.log(JSON.stringify(record, null, 2));

    return res.status(201).json({
      success: true,
      message: "RSVP record stored successfully",
      data: record,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ [ERROR] Failed to save RSVP (${durationMs}ms):`, error?.message || error);
    if (error?.code) {
      console.error(`   Prisma Error Code: ${error.code}`);
    }
    return res.status(500).json({
      success: false,
      error: "Internal server error while saving RSVP",
      details: error?.message || String(error),
    });
  }
});

// Alias for standard REST naming
app.post("/api/rsvp", (req: Request, res: Response) => {
  return res.redirect(307, "/api/save_wedding_rsvp");
});

// GET all records (to view in browser or dashboard)
app.get("/api/rsvp", async (req: Request, res: Response) => {
  try {
    const records = await prisma.weddingRSVP.findMany({
      orderBy: { createdAt: "desc" },
    });
    console.log(`📋 Retrieved ${records.length} RSVP records from DB`);
    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error("❌ Error retrieving RSVPs:", error?.message);
    return res.status(500).json({ success: false, error: error?.message });
  }
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ==========================================`);
  console.log(`🚀 Wed Ease RSVP Server running on port ${PORT}`);
  console.log(`👉 POST http://localhost:${PORT}/api/save_wedding_rsvp`);
  console.log(`👉 GET  http://localhost:${PORT}/api/rsvp`);
  console.log(`🚀 ==========================================\n`);
});
