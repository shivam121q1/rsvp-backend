import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Exact payload sent by the voice bot tool (save_wedding_rsvp)
interface RSVPPayload {
  guest_name: string;
  attendance: string;
  guest_count?: number;
  welcome_drink?: string;
  food_preference?: string;
  room_preference?: string;
  dietary_restrictions?: string;
  notes?: string;
}

// POST endpoint to store the RSVP
app.post("/api/save_wedding_rsvp", async (req: Request, res: Response) => {
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

    if (!guest_name) {
      return res.status(400).json({
        success: false,
        error: "guest_name is required",
      });
    }

    const record = await prisma.weddingRSVP.create({
      data: {
        guestName: guest_name,
        attendance: attendance || "Yes",
        guestCount: Number(guest_count) || (attendance === "No" ? 0 : 1),
        welcomeDrink: welcome_drink || null,
        foodPreference: food_preference || null,
        roomPreference: room_preference || null,
        dietaryRestrictions: dietary_restrictions || null,
        notes: notes || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "RSVP record stored successfully",
      data: record,
    });
  } catch (error: any) {
    console.error("Error storing RSVP:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while saving RSVP",
      details: error?.message,
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
    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 POST http://localhost:${PORT}/api/save_wedding_rsvp`);
});
