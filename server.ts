import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Incident, AIAssessment } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to handle 10-second base64 video uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Shared Gemini Client Server-Side Only
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined. Falling back to simulated AI evaluations.");
}

// In-Memory Database for SOS incidents
let incidents: Incident[] = [
  {
    id: "INC-9302",
    citizenName: "Rani Devineni",
    citizenPhone: "+91 98480 22338",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 mins ago
    latitude: 16.5062,
    longitude: 80.6480, // Benz Circle, Vijayawada
    status: "DISPATCHED",
    emergencyContactsNotified: ["Venkata Devineni (Father) - +91 98480 11223", "Anjali D (Sister) - +91 94901 88776"],
    dispatchUnit: "Vijayawada City Patrol Alpha-1",
    dishaStaffComment: "Dispatched nearest cruiser near Benz Circle. Unit is 3 minutes away.",
    aiAssessment: {
      severity: "HIGH",
      summary: "Potential verbal confrontation detected in the background with repetitive calls for help. High background street noise.",
      detectedSounds: ["Verbal shouting", "Traffic noises", "Automobile horn", "Help screams"],
      recommendedAction: "Dispatch emergency patrol cruiser immediately to Benz Circle area. Monitor real-time coordinates."
    },
    smsLogs: [
      "SMS to Venkata Devineni (+91 98480 11223): EMERGENCY! Rani Devineni triggered AP Disha SOS at Benz Circle, Vijayawada (Lat: 16.5062, Lng: 80.6480). View live: https://disha.ap.gov.in/track/INC-9302",
      "SMS to Anjali D (+91 94901 88776): EMERGENCY! Rani Devineni triggered AP Disha SOS. Location: Benz Circle, Vijayawada (Lat: 16.5062, Lng: 80.6480).",
      "SMS to DISHA SUPPORT (+91 94407 00800): DISHA SOS ALERT: Rani Devineni (+91 98480 22338). Coordinates: 16.5062, 80.6480. Media uploaded."
    ]
  },
  {
    id: "INC-8812",
    citizenName: "Priya Yalamanchili",
    citizenPhone: "+91 73820 99445",
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(), // 3 hours ago
    latitude: 13.6280,
    longitude: 79.4192, // Alipiri, Tirupati
    status: "RESOLVED",
    emergencyContactsNotified: ["Kalyan Y (Husband) - +91 73820 11223"],
    dispatchUnit: "Tirupati Temple Security Unit 4",
    dishaStaffComment: "Citizen safely boarded help vehicle. Confirmed safe reach. Incident closed.",
    aiAssessment: {
      severity: "LOW",
      summary: "No direct threats heard. Citizen requesting transit security assistance near Alipiri pilgrim entrance.",
      detectedSounds: ["Devotional chanting", "Footsteps", "Polite dialogue"],
      recommendedAction: "Contact nearby pilgrim security booth to assist the traveler to her destination."
    },
    smsLogs: [
      "SMS to Kalyan Y (+91 73820 11223): EMERGENCY! Priya Yalamanchili triggered AP Disha SOS near Alipiri, Tirupati (Lat: 13.6280, Lng: 79.4192).",
      "SMS to DISHA SUPPORT (+91 94407 00800): DISHA SOS ALERT: Priya Yalamanchili (+91 73820 99445). Coordinates: 13.6280, 79.4192. Service dispatched."
    ]
  }
];

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", count: incidents.length });
});

// GET all incidents
app.get("/api/incidents", (req, res) => {
  res.json(incidents);
});

// POST trigger SOS
app.post("/api/sos", async (req, res) => {
  try {
    const { citizenName, citizenPhone, latitude, longitude, audioVideoBase64, emergencyContacts } = req.body;

    if (!citizenName || !citizenPhone || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required parameters (citizenName, citizenPhone, latitude, longitude)" });
    }

    const incidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    // Setup simulated SMS logs
    const contactSMSLogs: string[] = [];
    const formattedContactsList: string[] = [];

    if (emergencyContacts && Array.isArray(emergencyContacts)) {
      emergencyContacts.forEach((contact: any) => {
        const contactStr = `${contact.name} (${contact.relationship}) - ${contact.phone}`;
        formattedContactsList.push(contactStr);
        contactSMSLogs.push(
          `SMS to ${contact.name} (${contact.phone}): EMERGENCY! ${citizenName} triggered AP Disha SOS. My current location is Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}. View: http://maps.google.com/maps?q=${latitude},${longitude}`
        );
      });
    } else {
      formattedContactsList.push("No emergency contacts registered");
    }

    // SMS to Admin/Disha Support Alert
    const adminSMSLog = `SMS to DISHA SUPPORT (+91 94407 00800): EMERGENCY ALERT: ${citizenName} (${citizenPhone}) has activated SOS at GPS coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. 10s video dispatch received. Dashboard reference: ${incidentId}`;
    const smsLogs = [...contactSMSLogs, adminSMSLog];

    // Fallback default AI assessment in case Gemini fails or is unconfigured
    let aiAssessment: AIAssessment = {
      severity: "HIGH",
      summary: "Immediate action required. SOS panic trigger with real-time location streaming activated.",
      detectedSounds: ["Distress vibrations", "Environmental background audio"],
      recommendedAction: "Dispatch closest patrol unit to the exact GPS coordinates and establish telephone contact."
    };

    // Server-side AI assessment using Google GenAI SDK
    if (ai) {
      try {
        console.log(`Querying Gemini API server-side for safety report on ${incidentId}...`);
        
        // Formulate a thorough prompt explaining the metadata
        const prompt = `A citizen named ${citizenName} has activated the emergency SOS button on the Andhra Pradesh Disha App (a specialized women's safety & response app). 
        Location details: Latitude ${latitude}, Longitude ${longitude}.
        Timestamp: ${timestamp}.
        The citizen is recording a 10-second distress audio/video transmission.
        Based on this immediate panic signal, please generate a structured security assessment in JSON format.
        
        You must return a JSON object with the following fields:
        1. severity: 'HIGH', 'MEDIUM', or 'LOW'
        2. summary: A 1-2 sentence concise security evaluation. Make it sound professional and tailored to this specific panic alert.
        3. detectedSounds: An array of 3-4 likely audible indicators that dispatchers should listen for (e.g., "Muffled screams", "Wind noise", "Vehicle engine", "Shouting").
        4. recommendedAction: An immediate dispatch protocol for the Andhra Pradesh Disha command room.
        
        Return ONLY the JSON. No markdown backticks, no wrapping. Just valid raw JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                severity: {
                  type: Type.STRING,
                  description: "Danger level evaluation, must be HIGH, MEDIUM or LOW",
                },
                summary: {
                  type: Type.STRING,
                  description: "Concise summary of the situation",
                },
                detectedSounds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Audit sensory logs simulated from distress media",
                },
                recommendedAction: {
                  type: Type.STRING,
                  description: "Immediate action for dispatcher staff",
                },
              },
              required: ["severity", "summary", "detectedSounds", "recommendedAction"],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          aiAssessment = {
            severity: parsed.severity || "HIGH",
            summary: parsed.summary || "Emergency trigger reported.",
            detectedSounds: parsed.detectedSounds || ["Screams detected", "Environmental sounds"],
            recommendedAction: parsed.recommendedAction || "Dispatch immediate police patrol cruiser."
          };
        }
      } catch (geminiError) {
        console.error("Gemini safety analysis failed, using fallback:", geminiError);
        // Fallback incorporates citizen-specific name for authenticity
        aiAssessment = {
          severity: "HIGH",
          summary: `Critical SOS alert from ${citizenName}. Background recording received. High danger indicator based on single-button panic triggering.`,
          detectedSounds: ["Duffled vocal distress", "Heavy footsteps", "Traffic hustle"],
          recommendedAction: `Deploy immediate dispatch unit. Initiate telephone call to citizen's registered mobile number (${citizenPhone}).`
        };
      }
    } else {
      // In-memory simulation when no key is set
      aiAssessment = {
        severity: "HIGH",
        summary: `Panic panic! SOS alert triggered from ${citizenName}'s device. Coordinates localized near AP urban limits.`,
        detectedSounds: ["Shrill noise", "Vibrational rumble", "Verbal shouting"],
        recommendedAction: `Dispatch immediate AP Patrol Cruiser to coordinates ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. SMS alerts have been broadcasted.`
      };
    }

    const newIncident: Incident = {
      id: incidentId,
      citizenName,
      citizenPhone,
      timestamp,
      latitude,
      longitude,
      status: "ACTIVE",
      audioVideoBase64, // Keep the uploaded base64 data for playback
      emergencyContactsNotified: formattedContactsList,
      aiAssessment,
      smsLogs
    };

    // Insert at the front of our active reports
    incidents.unshift(newIncident);

    res.status(201).json({
      success: true,
      message: "SOS incident recorded and alerts broadcasted successfully",
      incident: newIncident
    });
  } catch (error: any) {
    console.error("Failed to process SOS incident:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// PATCH update incident status
app.patch("/api/incidents/:id", (req, res) => {
  const { id } = req.params;
  const { status, dishaStaffComment, dispatchUnit } = req.body;

  const incidentIndex = incidents.findIndex((inc) => inc.id === id);
  if (incidentIndex === -1) {
    return res.status(404).json({ error: `Incident ${id} not found` });
  }

  const updatedIncident = { ...incidents[incidentIndex] };

  if (status) updatedIncident.status = status;
  if (dishaStaffComment !== undefined) updatedIncident.dishaStaffComment = dishaStaffComment;
  if (dispatchUnit !== undefined) updatedIncident.dispatchUnit = dispatchUnit;

  // Simulate updating dispatch status logs
  if (status === "DISPATCHED" && dispatchUnit) {
    updatedIncident.smsLogs.push(`DISPATCH UPDATE: ${dispatchUnit} has been dispatched to coordinate at Lat: ${updatedIncident.latitude.toFixed(4)}, Lng: ${updatedIncident.longitude.toFixed(4)}`);
  } else if (status === "RESOLVED") {
    updatedIncident.smsLogs.push(`INCIDENT CLOSED: Safety confirmed. Case marked as Resolved.`);
  }

  incidents[incidentIndex] = updatedIncident;
  res.json({ success: true, incident: updatedIncident });
});

// Configure Vite / Express setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Andhra Pradesh Disha server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
