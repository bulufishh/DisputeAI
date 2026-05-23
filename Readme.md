STACK
Front end - Netlify (static)
BAckend - Netlify functions (severless express)
Ai chat - Google Gemni 2.0 Flash
OCR - Google cloud Vision API
Database - Supabase


SETUP
Step 1 - Get your AI API Key
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

Supabase
1. Go to https://supabase.com and sign up
2. New peoject
3. Go to settings --> api
4. copy "project URL" and "anon public key"

Step 2: Set up supabase databse
1. In the supabase dashboard --> sql editor --> new query
2. paste the entire contents of supabase/scheme.sql
3. click run
4. "Success" should pop up , two tables will be created: cases and notifications

Step 3: Add your API key
Open backend /.env file and add your key

Step 4: If you want to run locally 
On terminal
cd server
npm install
npm start


API ROUTES
GET   /api/health --> checks all services are connected
GET   /api/transactions --> Mock Be U Transaction data
POST  /api/chat  --> Gemini AI conversation
POST  /api/report  --> generate + save dispute report
POST  /api/scan --> Google Vision OCR
POST  /api/notify  --> Save wrong tarnsfer notification
'GET   /api/case/:id --> Retrive case from supabase


AI used in this project
1) Claude
2) ChatGPT
3) Figma
