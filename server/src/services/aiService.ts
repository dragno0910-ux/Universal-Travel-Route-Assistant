import axios from 'axios';
import { TravelPreferences, RouteOption, AIIntentExtractionResult, AIExplanationResult } from '../types/shared';
import { config } from '../config';

export class AIService {
  /**
   * Extract user preferences from unstructured natural language query
   */
  public async extractIntent(prompt: string): Promise<AIIntentExtractionResult> {
    const cleanPrompt = prompt.trim();

    // 1. Try LLM if API Key is configured
    if (config.geminiApiKey) {
      try {
        const geminiResult = await this.callGeminiIntentExtraction(cleanPrompt);
        if (geminiResult) return geminiResult;
      } catch (err) {
        console.warn('Gemini intent extraction failed, falling back to heuristic parser:', (err as Error).message);
      }
    } else if (config.openaiApiKey) {
      try {
        const openaiResult = await this.callOpenAIIntentExtraction(cleanPrompt);
        if (openaiResult) return openaiResult;
      } catch (err) {
        console.warn('OpenAI intent extraction failed, falling back to heuristic parser:', (err as Error).message);
      }
    }

    // 2. Intelligent Rule-based NLP Parser (Deterministic & Reliable without API keys)
    return this.ruleBasedIntentParser(cleanPrompt);
  }

  /**
   * Explain and personalize a verified route in reassuring natural language
   */
  public async explainRoute(route: RouteOption, userContext?: string): Promise<AIExplanationResult> {
    // 1. Try LLM if API Key is configured
    if (config.geminiApiKey) {
      try {
        const geminiExplanation = await this.callGeminiRouteExplanation(route, userContext);
        if (geminiExplanation) return geminiExplanation;
      } catch (err) {
        console.warn('Gemini route explanation failed, using template explainer:', (err as Error).message);
      }
    }

    // 2. Grounded Template-based Explainer (Strictly grounded on route object to prevent hallucination)
    return this.groundedTemplateExplainer(route, userContext);
  }

  /**
   * Conversational Assistant for travel queries
   */
  public async answerTravelQuestion(question: string, activeRoute?: RouteOption): Promise<string> {
    const qLower = question.toLowerCase();

    if (qLower.includes('luggage') || qLower.includes('bag') || qLower.includes('suitcase')) {
      return `🧳 **Luggage Guidance for Mumbai:**\n- **Metro Lines (1, 2A, 7, 3):** Very luggage-friendly! All stations have elevators, escalators, and wide security scanners. AC coaches have dedicated spaces near doors.\n- **Mumbai Suburban Local Trains:** Allowed, but during morning peak (8:00 AM - 11:00 AM southbound) and evening peak (5:30 PM - 8:30 PM northbound), local trains are extremely packed ("super-dense crush load"). Avoid carrying bulky luggage on second class trains during peak hours; consider Metro, Auto, or Cab instead.\n- **Auto Rickshaws & Cabs:** Auto rickshaws have space behind the passenger seat for 1-2 medium suitcases. Black & Yellow taxis (Kaali Peeli) have rooftop carriers or trunk space.`;
    }

    if (qLower.includes('ticket') || qLower.includes('uts') || qLower.includes('chalo') || qLower.includes('buy')) {
      return `🎫 **Ticketing & Fare Payments in Mumbai:**\n- **Suburban Railway (Local Trains):** Download the official **UTS App** by Indian Railways to buy unreserved paperless tickets directly on your phone and skip station queues. Alternatively, use ATVM kiosks at station entrances using UPI (Google Pay, PhonePe, Paytm).\n- **Mumbai Metro:** Scan a QR ticket via the **Mumbai 1 App** or send a WhatsApp message to +91 96700 08889 to get an instant WhatsApp QR ticket on your phone.\n- **BEST Buses:** Pay using cash, UPI, or use the **Chalo App** / Chalo Smart Card for tap-and-go bus travel.`;
    }

    if (qLower.includes('safety') || qLower.includes('night') || qLower.includes('safe')) {
      return `🛡️ **Safety & Night Travel in Mumbai:**\n- Mumbai is widely regarded as one of the safest metropolitan cities in India, with active police presence at transit nodes.\n- **Local Trains:** Have dedicated **Ladies Coaches** (green-yellow stripes) guarded by Railway Protection Force (RPF) personnel from 8 PM to 6 AM.\n- **Auto Rickshaws & Taxis:** Always insist on the electronic meter ("Meter chalu karo"). Between 12:00 AM and 5:00 AM, the official RTO tariff includes a 25% night surcharge.\n- At Airport T2, always book from the official prepaid taxi counter inside the terminal (Level P4) or use verified app cabs (Uber/Ola) rather than unverified touts.`;
    }

    if (qLower.includes('auto') || qLower.includes('rickshaw') || qLower.includes('meter')) {
      return `🛺 **Auto Rickshaw Rules in Mumbai:**\n- **South Mumbai Restriction:** Auto rickshaws are strictly prohibited south of Bandra/Mahim and Sion. In South Mumbai (Churchgate, CSMT, Colaba, Marine Drive), you must take Black-and-Yellow (Kaali Peeli) taxis or app cabs.\n- **Meter Tariff:** Base fare is ₹23 for the first 1.5 km, and ₹15.33 for each subsequent km.\n- Drivers must go by the digital electronic meter mounted in the front.`;
    }

    if (activeRoute) {
      return `📍 **Regarding your current route (${activeRoute.title}):**\nTotal travel time is approximately **${activeRoute.durationMinutes} minutes** with an estimated cost of **₹${activeRoute.totalCostINR}** across ${activeRoute.legs.length} step(s).\nNext step: "${activeRoute.legs[0]?.instruction}". Feel free to ask if you need details on ticket counters, interchange directions, or accessibility!`;
    }

    return `Hello! I am your Mumbai Travel & Route Guide. Ask me anything about routes, Metro vs local trains, ticket purchasing (UTS, Chalo, Metro 1), luggage rules, airport transfers, or auto rickshaw tariffs!`;
  }

  // --- PRIVATE IMPLEMENTATION METHODS ---

  private ruleBasedIntentParser(prompt: string): AIIntentExtractionResult {
    const lower = prompt.toLowerCase();
    const prefs: TravelPreferences = {};

    // 1. Budget extraction (e.g., "under 200", "₹300", "300 rs", "budget 150")
    const budgetMatch = lower.match(/(?:budget|under|within|max|₹|rs\.?|inr)\s*:?\s*(\d{2,4})/i) ||
                        lower.match(/(\d{2,4})\s*(?:rs|rupees|inr|₹)/i);
    if (budgetMatch && budgetMatch[1]) {
      prefs.maxBudgetINR = parseInt(budgetMatch[1], 10);
      if (prefs.maxBudgetINR <= 50) {
        prefs.priority = 'cheapest';
      }
    }

    // 2. Luggage detection
    if (/luggage|suitcase|suitcases|bags|baggage|heavy/i.test(lower)) {
      prefs.luggageFriendly = true;
      prefs.priority = 'comfort';
    }

    // 3. Accessibility
    if (/wheelchair|accessible|step-free|elevator|escalator|elderly|disabled/i.test(lower)) {
      prefs.accessibilityRequired = true;
      prefs.priority = 'comfort';
    }

    // 4. Priority hints
    if (/cheap|cheapest|budget|least cost|lowest fare/i.test(lower)) {
      prefs.priority = 'cheapest';
    } else if (/fast|fastest|quick|rush|urgent|asap/i.test(lower)) {
      prefs.priority = 'fastest';
    } else if (/comfort|comfortable|ac|air condition|cab|taxi/i.test(lower)) {
      prefs.priority = 'comfort';
    } else if (/least walk|less walking|no walk|minimal walk/i.test(lower)) {
      prefs.priority = 'least_walking';
      prefs.maxWalkingMeters = 300;
    }

    // 5. Origin and destination detection (e.g. "from airport to colaba", "bandra to gateway")
    let originQuery: string | undefined;
    let destinationQuery: string | undefined;

    const fromToMatch = lower.match(/(?:from\s+)(.+?)(?:\s+to\s+)(.+?)(?:$|\s+with|\s+under|\s+having|\s+in\s+)/i);
    if (fromToMatch) {
      originQuery = fromToMatch[1].trim();
      destinationQuery = fromToMatch[2].trim();
    } else {
      const toMatch = lower.match(/(?:to\s+)(.+?)(?:$|\s+with|\s+under|\s+from)/i);
      if (toMatch) {
        destinationQuery = toMatch[1].trim();
      }
    }

    return {
      extractedPreferences: prefs,
      originQuery,
      destinationQuery,
      recognizedIntent: `Identified preference: ${prefs.priority || 'balanced'}, budget: ${prefs.maxBudgetINR ? '₹' + prefs.maxBudgetINR : 'standard'}, luggage-friendly: ${prefs.luggageFriendly ? 'yes' : 'no'}`,
      confidence: 0.92
    };
  }

  private groundedTemplateExplainer(route: RouteOption, context?: string): AIExplanationResult {
    const isLuggage = route.tag === 'Comfort / Luggage';
    const isCheapest = route.tag === 'Cheapest';
    const isCab = route.tag === 'Direct Cab';

    let explanation = `Here is your verified step-by-step route for **${route.title}**. Total duration is approximately **${route.durationMinutes} minutes** for a total cost of **₹${route.totalCostINR}**.`;

    if (isLuggage) {
      explanation += ` This option prioritizes step-free elevators, air-conditioned coaches, and minimal walking so you can move smoothly with bags without climbing crowded footbridges.`;
    } else if (isCheapest) {
      explanation += ` This is your most budget-conscious route, costing only ₹${route.totalCostINR}. It utilizes local suburban railway networks and public transit.`;
    } else if (isCab) {
      explanation += ` This is a direct door-to-door drive without any transfers. Great if you value privacy or are traveling late at night.`;
    }

    const highlights: string[] = [
      `⏱️ Estimated travel time: ${route.durationMinutes} mins`,
      `💰 Total fare: ₹${route.totalCostINR}`,
      `🔄 Transfers: ${route.transfers === 0 ? 'Direct (0 transfers)' : `${route.transfers} transfer(s)`}`,
      `🚶 Total walking: ~${route.walkingDistanceMeters}m`
    ];

    const firstTimeVisitorTips: string[] = [
      'Keep your ticket or QR code ready at all entry and exit turnstiles.',
      'Listen for platform announcements which are made in Marathi, Hindi, and English.',
      'If taking local trains, note that trains stop for only 30-45 seconds at each intermediate station—move towards the door a minute before your station.'
    ];

    const localProTips: string[] = [
      'Use the UTS mobile app to skip ticket counter queues at railway stations.',
      'Look for the blue and yellow signboards on station footbridges for platform directions.',
      'Auto rickshaws only operate north of Bandra/Sion; in South Mumbai, hail a black-and-yellow taxi.'
    ];

    return {
      routeId: route.id,
      explanation,
      highlights,
      firstTimeVisitorTips,
      localProTips
    };
  }

  private async callGeminiIntentExtraction(prompt: string): Promise<AIIntentExtractionResult | null> {
    const systemPrompt = `You are a structured intent extractor for a Mumbai travel assistant.
Parse the user request and return STRICTLY a JSON object with this shape:
{
  "extractedPreferences": {
    "maxBudgetINR": number or null,
    "luggageFriendly": boolean,
    "accessibilityRequired": boolean,
    "priority": "fastest" | "cheapest" | "least_walking" | "comfort" | "balanced",
    "modePreference": string[]
  },
  "originQuery": string or null,
  "destinationQuery": string or null,
  "recognizedIntent": string
}
Do NOT include markdown formatting or backticks. Return pure JSON.`;

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
      {
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser request: "${prompt}"` }] }
        ]
      },
      { timeout: 5000 }
    );

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      extractedPreferences: parsed.extractedPreferences || {},
      originQuery: parsed.originQuery || undefined,
      destinationQuery: parsed.destinationQuery || undefined,
      recognizedIntent: parsed.recognizedIntent || 'Intent recognized',
      confidence: 0.95
    };
  }

  private async callOpenAIIntentExtraction(prompt: string): Promise<AIIntentExtractionResult | null> {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You extract travel constraints into structured JSON. Output only JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: { Authorization: `Bearer ${config.openaiApiKey}` },
        timeout: 5000
      }
    );

    const content = res.data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return {
      extractedPreferences: parsed.extractedPreferences || parsed,
      originQuery: parsed.originQuery,
      destinationQuery: parsed.destinationQuery,
      recognizedIntent: parsed.recognizedIntent || 'Processed via OpenAI',
      confidence: 0.95
    };
  }

  private async callGeminiRouteExplanation(route: RouteOption, userContext?: string): Promise<AIExplanationResult | null> {
    const prompt = `You are a friendly, encouraging personal travel guide in Mumbai.
Given this verified route:
${JSON.stringify({
  title: route.title,
  durationMinutes: route.durationMinutes,
  totalCostINR: route.totalCostINR,
  transfers: route.transfers,
  legs: route.legs.map(l => ({ mode: l.mode, instruction: l.instruction, tip: l.guidanceTip, cost: l.costINR }))
}, null, 2)}
User Context: ${userContext || 'First-time traveler'}

IMPORTANT: Never invent new stations, fares, or lines. Stick strictly to the numbers in the route object.
Return JSON:
{
  "explanation": "...",
  "highlights": ["..."],
  "firstTimeVisitorTips": ["..."],
  "localProTips": ["..."]
}`;

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
      {
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ]
      },
      { timeout: 5000 }
    );

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      routeId: route.id,
      explanation: parsed.explanation,
      highlights: parsed.highlights || [],
      firstTimeVisitorTips: parsed.firstTimeVisitorTips || [],
      localProTips: parsed.localProTips || []
    };
  }
}

export const aiService = new AIService();
