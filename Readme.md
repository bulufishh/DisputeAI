**STACK**   
Front end - Netlify (static)
BAckend - Netlify functions (severless express)
Ai chat - Google Gemni 2.0 Flash
OCR - Google cloud Vision API
Database - Supabase


**SETUP steps**   
Prerequisite  
- Node.js installed on your machine (v18 or above)

Step 1 - clone or download the project  
Place the disputeai/ folder on your machine  
The structure should have frontend/, server/, netlify/, 
and supabase/ inside it.

Step 2 - Get your all four API Key  
Geimini API 
1. Go to https://ai.google.dev
2. Sign in 
3. Click Create API key
4. Copy the key 

Google Cloud Vision API  
1. Go to https://console.cloud.google.com
2. Create a new project
3. Search for "Cloud Vision Api" and enable it
4. Go to credentials --> create credentials --> api key
5. copy the key

Supabase url + anon key
1. Go to https://supabase.com and sign up
2. New peoject
3. Go to settings --> api
4. copy "project URL" and "anon public key"

Step 3: Set up supabase databse
1. In the supabase dashboard --> sql editor --> new query
2. paste the entire contents of supabase/scheme.sql
3. click run
4. "Success" should pop up , two tables will be created: cases and notifications

Step 4: Add your API key
Copy .env.example to .env at the project root and fill in your four keys:
Open backend /.env file and add your key

GEMINI_API_KEY= "_____"
GOOGLE_VISION_KEY="_______"
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY="_______"
PORT=3000


Step 5: If you want to run locally   
On terminal  
cd server  
npm install  
npm start  



**API ROUTES**
GET   /api/health --> checks all services are connected  
GET   /api/transactions --> Mock Be U Transaction data  
POST  /api/chat  --> Gemini AI conversation  
POST  /api/report  --> generate + save dispute report  
POST  /api/scan --> Google Vision OCR  
POST  /api/notify  --> Save wrong tarnsfer notification  
'GET   /api/case/:id --> Retrive case from supabase  



**Technology Used**
Frontend  
	•	Vanilla HTML, CSS, and JavaScript — no frameworks, no build step required
	•	jsPDF (CDN) — generates downloadable PDF dispute reports in the browser
	•	Google Fonts — Plus Jakarta Sans and JetBrains Mono

Backend  
Node.js with Express — RESTful API server
	•	serverless-http — wraps Express for deployment as a Netlify serverless function
	•	node-fetch — makes HTTP requests from the server to external AI APIs
	•	dotenv — loads environment variables from the .env file

Database  
	•	Supabase (PostgreSQL) — stores generated dispute cases and wrong-transfer notifications with full JSONB support for timeline and routing data

Deployment  
Netlify — hosts the frontend as static files and the backend as serverless functions from the same repository
	•	GitHub — source control and continuous deployment trigger



**HOW THE SYSTEN US BUILT**。
Layer 1 - Frontend  
The entire UI is a state-driven single-page app written in vanilla JavaScript, split across three files. state.js holds the single source of truth for the whole app — the user’s transaction data, chat history, collected evidence, and generated report all live here. screens.js contains one function per screen that builds HTML from that live state data. app.js handles all user actions, API calls, and the boot sequence. There is no page reload at any point — navigating between screens re-renders the DOM in-place.

Layer 2 - Backend  
The Express server is split into routes and helpers. Each of the six API endpoints has its own file in routes/ and calls only what it needs from helpers/. The Gemini helper centralises all AI calls with automatic retry-with-backoff on 429 rate limit errors — it reads the exact retry delay from Gemini’s response body and waits that long before retrying, up to three times per model, across three models. The OCR helper is a two-step pipeline: Google Cloud Vision extracts raw text from the uploaded screenshot first (purpose-built for reading small text and phone numbers in chat bubbles), then Gemini interprets that raw text to identify the scam type, contact details, and red flags.

Layer 3 - Data  
Transaction data currently comes from a local mockTransactions.json file that mirrors what the real Bank Islam Be U API would return. Generated dispute reports are saved to Supabase and retrievable by case ID. Wrong-transfer notifications are also logged to Supabase for audit trail purposes.

Request flow  
Every time the user sends a message, the frontend sends the complete conversation history — not just the latest message — to /api/chat. This is necessary because Gemini is stateless between calls and has no memory. The backend injects a system prompt telling Gemini it is DisputeAI and already knows the transaction details (amount, merchant, reference number, time), then forwards the full history to Gemini. The response comes back as plain text and is appended to state.chatHistory for the next call.


** AI Tools used **  
Google Gemini 2.0 Flash — conversational AI and report generation
Used for two distinct tasks. In the dispute intake chat (Screen 5), Gemini acts as a guided interview assistant — it already knows the transaction details from the mock Be U data, asks targeted questions to collect the four key evidence facts (contact method, scam technique, scammer identity, and available screenshots), and keeps responses under three sentences. For report generation (Screen 6 → 7), Gemini receives the entire conversation history and is instructed at low temperature (0.1) to extract a structured JSON dispute report containing the case ID, fraud type, timeline, AI-generated summary, and evidence count. The conditional system_instruction design avoids a Gemini 400 error that occurs when a null prompt is sent.

Google Cloud Vision API — screenshot OCR
Used in a two-step pipeline when the user uploads a WhatsApp or other messaging screenshot. Vision’s TEXT_DETECTION feature extracts all raw text from the image — it handles small fonts, compressed JPEG artefacts, and overlapping UI elements better than a general vision model. The raw text is then passed to Gemini for intelligent interpretation, producing structured output: phone number, timestamp, platform, message content, scam keywords, scam type, confidence level, and specific red flags. This two-model approach produces more reliable evidence extraction than using Gemini Vision alone.

Gemini (report) — structured JSON extraction
A separate use of the Gemini API distinct from the chat function. The full conversation history is sent with a precise extraction prompt at temperature 0.1, asking Gemini to produce only a JSON object with no markdown fences. The parseGeminiJSON() helper strips any accidental code fences before parsing. If the JSON is malformed, a pre-built fallback report is returned instead so the demo never breaks.

Claude
Claude was used as a reference tool during development — primarily to get quick answers on API integration, check syntax, and look up documentation faster than searching manually. It helped speed up some of the more repetitive parts of the build, such as structuring the Express routes and formatting the Supabase schema, but the overall system design, feature decisions, and project direction came from the team. We mainly used it as resource to consult.

