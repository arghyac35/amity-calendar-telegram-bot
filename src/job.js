var request = require('request')
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

async function updateTodaysClass() {
  await request(process.env.UPDATE_URL);
}
updateTodaysClass();
