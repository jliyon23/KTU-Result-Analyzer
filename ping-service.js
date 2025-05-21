const https = require('https');

// Your Render URL (replace with your actual app URL)
const APP_URL = 'https://your-app-name.onrender.com/health';
// Ping interval in milliseconds (14 minutes = 840000ms)
const PING_INTERVAL = 840000;

function pingApp() {
  console.log(`Pinging ${APP_URL} at ${new Date().toISOString()}`);
  
  https.get(APP_URL, (res) => {
    console.log(`Response status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`Error pinging app: ${err.message}`);
  });
}

// Initial ping
pingApp();

// Schedule regular pings
setInterval(pingApp, PING_INTERVAL);

console.log(`Ping service started. Pinging ${APP_URL} every ${PING_INTERVAL/60000} minutes.`); 