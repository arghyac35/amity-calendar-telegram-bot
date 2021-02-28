import axios from "axios";
import { writeFile } from "fs";
import config from './config';

async function downloadCreds() {
  try {

    const req1 = axios.get(config.clientSecretUrl);
    const req2 = axios.get(config.credentialsUrl);

    await axios.all([req1, req2]).then(axios.spread((...responses) => {
      const clientSecret = responses[0];
      const credentials = responses[1];

      writeFile('./client_secret.json', JSON.stringify(clientSecret.data), (err) => {
        if (err) console.error(err);
        console.log('Client secret downloaded');
      });

      writeFile('./credentials.json', JSON.stringify(credentials.data), (err) => {
        if (err) console.error(err);
        console.log('Credentials downloaded');
      });

    }));
  } catch (error) {
    console.log(error.messsage);
  }
}
downloadCreds();
