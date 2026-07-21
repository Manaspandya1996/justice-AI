import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { CaseItem, AnalysisResult } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client inside endpoints to prevent startup crashes if GEMINI_API_KEY is missing
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please add your key in the Secrets panel.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-Memory Database to support both Citizen & Police Portals in real-time
let casesDB: CaseItem[] = [
  {
    id: "FIR-2026-0892",
    complainantName: "Manish Kumar Sharma",
    complainantPhone: "+91 98765 43210",
    complainantAadhaar: "XXXX-XXXX-8921",
    incidentDate: "2026-07-18T14:30:00.000Z",
    incidentDescription: "I scanned a refund QR code sent to me via WhatsApp by someone claiming to be HDFC Customer Care. They promised a cashback refund of ₹50,000. Immediately after scanning, ₹50,000 was debited from my bank account in three UPI transactions of ₹20,000, ₹20,000, and ₹10,000. The recipient name was 'Syam Traders' on GPay. I have screenshots of the WhatsApp chat and transaction records.",
    category: "Cyber Crime",
    crimeType: "UPI Fraud / QR Code Scam",
    severity: "High",
    urgencyLevel: "Critical",
    riskScore: 88,
    status: "Under Investigation",
    submittedAt: "2026-07-18T15:15:00.000Z",
    evidence: ["whatsapp_chats.jpg", "gpay_debit_record.pdf"],
    signature: "verified_aadhaar_signature",
    timeline: [
      {
        date: "2026-07-18T15:15:00.000Z",
        title: "FIR Filed & Registered",
        description: "Complainant verified identity via Aadhaar. FIR drafted and submitted into Central System.",
        type: "success"
      },
      {
        date: "2026-07-18T15:45:00.000Z",
        title: "Bank Freeze Request Issued",
        description: "Automated freeze alerts sent to HDFC Bank and ICICI Bank (destination nodes).",
        type: "info"
      },
      {
        date: "2026-07-19T10:00:00.000Z",
        title: "Cyber Cell Assigned",
        description: "Investigating Officer Inspector Rajesh Sen assigned to trace digital footmarks.",
        type: "info"
      }
    ],
    documents: {
      fir: "FIRST INFORMATION REPORT\n(Under Section 173 BNSS, 2023)\n\n1. District: New Delhi Central  |  Police Station: Cyber Crime Cell\n2. FIR No: CCA-2026-0892  |  Date of Filing: 18-07-2026\n3. Acts & Sections:\n   - Bharatiya Nyaya Sanhita (BNS), 2023: Section 318 (Cheating)\n   - Information Technology Act, 2000: Section 66D (Cheating by personation using computer resource)\n\n4. Complainant Details:\n   Name: Manish Kumar Sharma\n   Phone: +91 98765 43210\n   Address: 14/B, Connaught Place, New Delhi\n\n5. Details of Incident:\n   Date/Time of Occurrence: 18-07-2026, 14:30 Hours\n   Brief Narration: The victim scanned a fraudulent QR code on WhatsApp expecting a refund, which initiated unauthorized UPI debit transactions totaling ₹50,000 to beneficiary 'Syam Traders'.\n\n6. Official Actions taken:\n   - Case assigned to Cyber Cell.\n   - Formal notices dispatched to standard gateways.\n\nFiling Agent: JusticeAI Police System (Simulated e-Sign)"
    }
  },
  {
    id: "FIR-2026-0421",
    complainantName: "Anjali Patel",
    complainantPhone: "+91 87654 32109",
    complainantAadhaar: "XXXX-XXXX-4210",
    incidentDate: "2026-07-19T09:15:00.000Z",
    incidentDescription: "Someone has hacked into my personal Instagram account (handle: @anjali_patel_7) and changed my recovery email and password. Now, they are posting inappropriate edited photos of me and demanding ₹25,000 in Bitcoins to return the account access. They are sending WhatsApp threats from an unknown international number (+1 415-322-8192).",
    category: "Cyber Crime",
    crimeType: "Cyber Extortion & Identity Theft",
    severity: "High",
    urgencyLevel: "Urgent",
    riskScore: 78,
    status: "Active",
    submittedAt: "2026-07-19T10:30:00.000Z",
    evidence: ["insta_profile_screenshot.png", "whatsapp_ransom_threats.jpg"],
    signature: "verified_aadhaar_signature",
    timeline: [
      {
        date: "2026-07-19T10:30:00.000Z",
        title: "Complaint Registered",
        description: "Cyber blackmail and identity theft incident logged and analyzed.",
        type: "success"
      },
      {
        date: "2026-07-19T11:00:00.000Z",
        title: "Instagram/Meta Notice Drafted",
        description: "Official legal request sent to Meta Incident Response Team to lock the compromised handle.",
        type: "info"
      }
    ],
    documents: {}
  },
  {
    id: "FIR-2026-1033",
    complainantName: "Rohan Deshmukh",
    complainantPhone: "+91 91234 56789",
    complainantAadhaar: "XXXX-XXXX-1033",
    incidentDate: "2026-07-15T22:00:00.000Z",
    incidentDescription: "Two unknown individuals on a motorbike stopped me near Sector-4 Dwarka, assaulted me physically with wooden sticks, and snatched my gold chain and wallet containing ₹5,000 cash, credit cards, and driver's license. I sustained minor head injuries and bruises on my arms. I was treated at Dwarka General Hospital.",
    category: "Violent Crime",
    crimeType: "Assault & Robbery",
    severity: "High",
    urgencyLevel: "Critical",
    riskScore: 92,
    status: "Closed",
    submittedAt: "2026-07-16T08:00:00.000Z",
    evidence: ["hospital_injury_report.pdf", "dwarka_cctv_footage_info.txt"],
    signature: "verified_aadhaar_signature",
    timeline: [
      {
        date: "2026-07-16T08:00:00.000Z",
        title: "Physical Case Logged",
        description: "FIR registered under robbery and assault sections.",
        type: "success"
      },
      {
        date: "2026-07-16T14:00:00.000Z",
        title: "CCTV Footages Retreived",
        description: "Dwarka Sector-4 traffic cameras checked. Motorbike registration plate identified.",
        type: "info"
      },
      {
        date: "2026-07-17T18:00:00.000Z",
        title: "Suspects Apprehended & Stolen Goods Recovered",
        description: "Dwarka local squad raided a hideout. Both suspects arrested and gold chain recovered.",
        type: "success"
      },
      {
        date: "2026-07-20T09:00:00.000Z",
        title: "Case Closed",
        description: "Chargesheet filed in court. Custody handed to judicial magistrate.",
        type: "success"
      }
    ],
    documents: {
      fir: "FIRST INFORMATION REPORT\n(Under Section 173 BNSS, 2023)\n\nDistrict: Dwarka Sub-division  |  Police Station: Dwarka Sector 23\nFIR No: CCA-2026-1033  |  Date of Filing: 16-07-2026\n\nActs & Sections:\n- Bharatiya Nyaya Sanhita (BNS), 2023: Section 309(4) (Robbery with assault)\n- Bharatiya Nyaya Sanhita (BNS), 2023: Section 115 (Voluntarily causing hurt)\n\nBrief Summary of Case:\nComplainant Rohan Deshmukh was assaulted and robbed of his personal property on Dwarka Main road on 15-07-2026 by two motorcycled outlaws.",
      witnessStatement: "WITNESS STATEMENT\n(Under Section 180 BNSS, 2023)\n\nWitness Name: Rohan Deshmukh\nDate of Statement: 16-07-2026\nStatement taken by: Sub-Inspector Amit G.\n\nStatement: 'On 15th July around 10:00 PM, I was walking back from Dwarka metro station. A black Pulsar motorcycle rode up on the sidewalk. Two boys, wearing helmets, jumped off. The taller one grabbed my collar and shouted to give him everything. When I resisted, the shorter boy struck me on my right arm and head with a heavy wooden bat. I fell, bleeding, and they grabbed my chain and wallet and sped off...'"
    }
  }
];

// 1. Get all cases
app.get("/api/cases", (req: Request, res: Response) => {
  res.json(casesDB);
});

// 2. Get specific case
app.get("/api/cases/:id", (req: Request, res: Response) => {
  const caseItem = casesDB.find((c) => c.id === req.params.id);
  if (!caseItem) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json(caseItem);
});

// 3. Create a new case
app.post("/api/cases", (req: Request, res: Response) => {
  const { complainantName, complainantPhone, complainantAadhaar, incidentDate, incidentDescription, category, crimeType, severity, urgencyLevel, riskScore, evidence, signature, analysis } = req.body;

  const newId = `FIR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const initialTimeline = [
    {
      date: new Date().toISOString(),
      title: "FIR Filed & Submitted",
      description: `E-Filing completed successfully under tracking ID ${newId}. Self-declaration validated via Aadhaar.`,
      type: "success" as const
    },
    {
      date: new Date(Date.now() + 5000).toISOString(),
      title: "Legal Intelligence Assessment",
      description: `JusticeAI parsed applicable Indian Laws (${analysis?.applicableSections?.map((s: any) => s.section).join(", ") || "BNS / IT Act"}).`,
      type: "info" as const
    },
    {
      date: new Date(Date.now() + 10000).toISOString(),
      title: "Assigned to Automated Intake Bureau",
      description: "Notices dispatched to nodal officers. Security checks validated.",
      type: "pending" as const
    }
  ];

  const defaultFIRDocument = `FIRST INFORMATION REPORT
(Under Section 173 BNSS, 2023)

1. District: Digital India Jurisdiction  |  National Cyber Cell Ingress
2. FIR No: CCA-${newId.split("-")[2]}  |  Date/Time of Filing: ${new Date().toLocaleDateString("en-IN")}
3. Applicable Laws & Sections:
${analysis?.applicableSections?.map((s: any) => `   - ${s.act}: ${s.section} (${s.title})`).join("\n") || "   - Bharatiya Nyaya Sanhita, 2023"}

4. Complainant Details:
   Name: ${complainantName}
   Contact Phone: ${complainantPhone}
   Identity: Aadhaar Number ${complainantAadhaar}

5. Chronology of Crime:
   Occurrence Date: ${new Date(incidentDate).toLocaleString("en-IN")}
   Detailed Narrative of Offense:
   "${incidentDescription}"

6. Recommended Next Actions for Investigation:
${analysis?.steps?.map((st: string, idx: number) => `   ${idx + 1}. ${st}`).join("\n") || "   1. Secure evidence logs.\n   2. Issue banking alert."}

7. Verification:
   Digitally Signed & Certified via Aadhaar OTP (UIDAI Vault Reference).
   Complainant declares this file as true under penalty of perjury (Section 229 BNS / 191 IPC).`;

  const newCase: CaseItem = {
    id: newId,
    complainantName,
    complainantPhone,
    complainantAadhaar,
    incidentDate,
    incidentDescription,
    category: category || "Cyber Crime",
    crimeType: crimeType || "Pending Classification",
    severity: severity || "Medium",
    urgencyLevel: urgencyLevel || "Urgent",
    riskScore: riskScore || 50,
    status: "Pending",
    submittedAt: new Date().toISOString(),
    evidence: evidence || [],
    signature,
    analysis,
    timeline: initialTimeline,
    documents: {
      fir: defaultFIRDocument
    }
  };

  casesDB.unshift(newCase);
  res.json(newCase);
});

// 4. Update timeline of a case
app.post("/api/cases/:id/timeline", (req: Request, res: Response) => {
  const { title, description, type } = req.body;
  const caseItem = casesDB.find((c) => c.id === req.params.id);
  
  if (!caseItem) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  caseItem.timeline.push({
    date: new Date().toISOString(),
    title,
    description,
    type: type || "info"
  });

  res.json(caseItem);
});

// 5. Update case status
app.post("/api/cases/:id/status", (req: Request, res: Response) => {
  const { status } = req.body;
  const caseItem = casesDB.find((c) => c.id === req.params.id);

  if (!caseItem) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  caseItem.status = status;
  
  // Append timeline update
  caseItem.timeline.push({
    date: new Date().toISOString(),
    title: `Status Changed: ${status}`,
    description: `Investigating officer updated case status to '${status}'.`,
    type: status === "Closed" ? "success" : "info"
  });

  res.json(caseItem);
});

// 6. Generate legal documents (Witness statement, Case diary, etc.)
app.post("/api/cases/:id/documents", async (req: Request, res: Response) => {
  const { documentType } = req.body; // 'caseDiary' | 'witnessStatement' | 'chargeSummary'
  const caseItem = casesDB.find((c) => c.id === req.params.id);

  if (!caseItem) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  try {
    const ai = getGeminiClient();
    
    let docTitle = "";
    let systemInstruction = "";
    if (documentType === "caseDiary") {
      docTitle = "Case Diary (Section 192 BNSS / 172 CrPC)";
      systemInstruction = "You are a senior Indian Police Investigation Officer writing a formal Case Diary. It must be detailed, strictly clinical, citing specific digital footprints, dates, and official protocols in a highly authoritative style.";
    } else if (documentType === "witnessStatement") {
      docTitle = "Witness Statement (Section 180 BNSS / 161 CrPC)";
      systemInstruction = "You are an Indian Sub-Inspector recording a formal witness statement from the victim. Write in first person ('I state that...'), logging detailed recollection of events, exact timestamps, emotional/financial impact, and cooperation in a clear statement style.";
    } else if (documentType === "chargeSummary") {
      docTitle = "Charge Sheet / Charge Summary (Section 193 BNSS / 173 CrPC)";
      systemInstruction = "You are a legal prosecutor framing charges against an accused in an Indian Court. Outline the list of charges, evidence cataloged, acts violated, and make a strong structured legal recommendation for prosecution.";
    }

    const prompt = `Case Details:
Complainant Name: ${caseItem.complainantName}
Incident Date: ${caseItem.incidentDate}
Category: ${caseItem.category}
Crime Type: ${caseItem.crimeType}
Incident Description: ${caseItem.incidentDescription}
Severity: ${caseItem.severity}
Urgency Level: ${caseItem.urgencyLevel}
Current Status: ${caseItem.status}

Draft a highly professional, enterprise-grade, official Indian Police Department ${docTitle} document based on these details. Include placeholders for official stamps, signatures, and legal sections. Maintain absolute legal gravity and structure, incorporating Bharatiya Nyaya Sanhita (BNS) 2023 or relevant acts. Exclude conversational pleasantries.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const docText = result.text || `Failed to draft ${docTitle}`;
    
    // Save generated document to database
    caseItem.documents[documentType as keyof typeof caseItem.documents] = docText;

    // Append to timeline
    caseItem.timeline.push({
      date: new Date().toISOString(),
      title: `${docTitle} Drafted`,
      description: "AI-powered engine successfully compiled official document.",
      type: "success"
    });

    res.json({ document: docText, caseItem });
  } catch (error: any) {
    console.error("Gemini Document Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate document via Gemini API" });
  }
});

// 7. Core Incident Analysis Endpoint (Uses Gemini API to extract everything)
app.post("/api/analyze-incident", async (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) {
    res.status(400).json({ error: "Please enter an incident description to analyze." });
    return;
  }

  try {
    const ai = getGeminiClient();

    const systemInstruction = `You are the core AI Legal Intelligence Engine for the Indian Cyber Crime Department (JusticeAI).
Your task is to analyze natural language criminal incident descriptions from Indian citizens, categorize them, map them precisely to Indian Statutes, calculate risk parameters, provide easy bilingual translations, and draft an official Indian First Information Report (FIR).

YOU MUST STRICTLY ADHERE TO THE FOLLOWING SECURITY RULES:
1. Never invent or hallucinate legal sections. Use exact provisions.
2. Ground your references strictly in Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Bharatiya Sakshya Adhiniyam (BSA) 2023, Information Technology Act 2000, POCSO Act, NDPS Act, Motor Vehicles Act, etc.
3. State your confidence clearly based on details provided.
4. Keep the tone completely authoritative, institutional, transparent, and empathetic.
5. Address the bilingual simple legal explanations in English, Hindi, and Gujarati.

Return your response in a single structured JSON object conforming exactly to the requested schema.`;

    const prompt = `Analyze this incident description: "${description}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Must be one of: Cyber Crime, Financial Crime, Violent Crime, Property Crime, Traffic Crime, Juvenile Crime, Women Safety, Child Protection, Economic Offence, National Security, Public Nuisance, or Other"
            },
            crimeType: {
              type: Type.STRING,
              description: "Specific crime name (e.g., Cyber Extortion, UPI Scam, Identity Theft, WhatsApp Fraud, Theft, Assault, Property Dispute, Domestic Violence, Defamation)"
            },
            severity: {
              type: Type.STRING,
              description: "High, Medium, or Low"
            },
            urgencyLevel: {
              type: Type.STRING,
              description: "Critical, Urgent, or Routine"
            },
            riskScore: {
              type: Type.INTEGER,
              description: "Numeric risk score from 1 to 100 based on severity, financial loss, and physical/digital danger"
            },
            financialLossRisk: {
              type: Type.STRING,
              description: "High, Medium, Low, or None"
            },
            identityTheftRisk: {
              type: Type.STRING,
              description: "High, Medium, Low, or None"
            },
            evidenceRequired: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A complete checklists of specific items required to investigate this crime (e.g. UPI Screenshots, IP Logs, Chat backup, Hospital reports)"
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: "Your assessment confidence percentage (e.g. 95)"
            },
            applicableSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  act: { type: Type.STRING, description: "Name of Act (e.g. Bharatiya Nyaya Sanhita (BNS) 2023, Information Technology Act 2000)" },
                  section: { type: Type.STRING, description: "Specific section code (e.g. Section 318, Section 66D)" },
                  title: { type: Type.STRING, description: "Legal name of offense (e.g. Punishment for Cheating)" },
                  description: { type: Type.STRING, description: "Direct Bare Act legal definition or text" },
                  whyApplies: { type: Type.STRING, description: "Detailed, custom-reasoned explanation linking the user's specific text to this law" },
                  punishmentMax: { type: Type.STRING, description: "Maximum prison/jail terms" },
                  punishmentMin: { type: Type.STRING, description: "Minimum prison/jail terms if any" },
                  fineMax: { type: Type.STRING, description: "Maximum fine/penalty details" },
                  bailable: { type: Type.BOOLEAN, description: "Is this offense bailable?" },
                  cognizable: { type: Type.BOOLEAN, description: "Is this offense cognizable (police can arrest without warrant)?" },
                  compoundable: { type: Type.BOOLEAN, description: "Is this compoundable (can be settled out of court)?" },
                  court: { type: Type.STRING, description: "Which court has trial jurisdiction (e.g. Magistrate First Class, Sessions Court)" }
                },
                required: ["act", "section", "title", "description", "whyApplies", "punishmentMax", "bailable", "cognizable", "court"]
              }
            },
            simpleExplanation: {
              type: Type.OBJECT,
              properties: {
                english: { type: Type.STRING, description: "Explain the legal offense in simple, layman, citizen-friendly English" },
                hindi: { type: Type.STRING, description: "Explain the legal offense in simple, citizen-friendly Hindi" },
                gujarati: { type: Type.STRING, description: "Explain the legal offense in simple, citizen-friendly Gujarati" }
              },
              required: ["english", "hindi", "gujarati"]
            },
            recommendedAction: {
              type: Type.STRING,
              description: "What the citizen should do immediately (e.g. Block credit card immediately, Call 1930, report on NCCRP)"
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Step-by-step logical process navigator items for the citizen"
            },
            draftFIR: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING, description: "Formal subject line for the police chief" },
                complainantDetails: { type: Type.STRING, description: "Placeholder for citizen name and address" },
                incidentDetails: { type: Type.STRING, description: "Structured summary of what happened" },
                legalSectionsText: { type: Type.STRING, description: "Summary of legal provisions that apply" },
                formalDraftText: { type: Type.STRING, description: "A beautifully structured, high-gravity official FIR application block text including formal greeting, detailed incident chronology, statutory sections, request for investigation, and digital sign placeholders." }
              },
              required: ["subject", "complainantDetails", "incidentDetails", "legalSectionsText", "formalDraftText"]
            }
          },
          required: [
            "category", "crimeType", "severity", "urgencyLevel", "riskScore", "financialLossRisk", 
            "identityTheftRisk", "evidenceRequired", "confidenceScore", "applicableSections", 
            "simpleExplanation", "recommendedAction", "steps", "draftFIR"
          ]
        }
      }
    });

    const analysisJsonString = response.text?.trim() || "";
    const resultJson = JSON.parse(analysisJsonString);
    res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini Core Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze incident using Gemini" });
  }
});

// Setup dev vs production environments
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode with Vite Middleware Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted.");
  } else {
    // Production Mode serving static output files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JusticeAI Server successfully running on http://localhost:${PORT}`);
  });
}

startServer();
