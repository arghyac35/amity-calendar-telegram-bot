var axios = require('axios')
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

async function updateTodaysClass() {
  await axios.get(process.env.UPDATE_URL);
}
updateTodaysClass();
