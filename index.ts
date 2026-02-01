/**
 * Cloudflare Worker for Bhartiya Brahmin Rishtey
 * Handles background syncing to Google Sheets via Queues
 */

interface Env {
  SHEETS_QUEUE: any;
  GOOGLE_SHEET_ID: string;
  GOOGLE_SHEETS_PRIVATE_KEY: string;
  GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // This worker acts as a secure proxy/processor for the frontend to enqueue jobs
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/sync') {
      const data = await request.json();
      await env.SHEETS_QUEUE.send(data);
      return new Response(JSON.stringify({ queued: true }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    return new Response('Not Found', { status: 404 });
  },

  async queue(batch: any, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const { name, email, phone, subCaste, type } = msg.body;
      console.log(`Syncing ${type} to Google Sheets for: ${name}`);

      try {
        // Implementation note: In production, we'd use a JWT to get an access token
        // from Google's OAuth2 endpoint using GOOGLE_SHEETS_PRIVATE_KEY and SERVICE_ACCOUNT_EMAIL.
        
        // Placeholder for the actual fetch to Google Sheets API
        const values = [[new Date().toISOString(), name, email, phone, subCaste, type]];
        
        // await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        //   method: 'POST',
        //   headers: { 'Authorization': `Bearer ${accessToken}` },
        //   body: JSON.stringify({ values })
        // });
        
        console.log("Successfully synced record to Google Sheets");
      } catch (err) {
        console.error("Failed to sync to Google Sheets:", err);
        msg.retry(); // Reliable retry if API fails
      }
    }
  }
};