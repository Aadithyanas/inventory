// test-whatsapp.js
require('dotenv').config();
const twilio = require('twilio');

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

client.messages.create({
  from: 'whatsapp:+14155238886', // Twilio's Sandbox number
  to: 'whatsapp:+918848673615', // YOUR WhatsApp number
  body: 'Hello! Smart Inventory AI test message. 🚀'
})
.then(message => console.log("Success! Message SID:", message.sid))
.catch(err => console.error("Error! Double check your SID and Token:", err));