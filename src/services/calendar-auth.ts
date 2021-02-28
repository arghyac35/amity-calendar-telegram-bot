import fs = require('fs');
import readline = require('readline');
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = './credentials.json';

/**
 * Authorize a client with credentials, then call the Google Drive API.
 */
export function call() {
  return new Promise((res, rej) => {
    // Load client secrets from a local file.
    fs.readFile('./client_secret.json', 'utf8', (err, content) => {
      if (err) {
        console.log('Error loading client secret file:', err.message);
        rej(err.message);
      } else {
        authorize(JSON.parse(content)).then(oAuth2Client => res(oAuth2Client)).catch(e => rej(e));
      }
    });
  })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials: any) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUris = credentials.installed.redirect_uris;
  const oAuth2Client = new google.auth.OAuth2(
    clientId, clientSecret, redirectUris[0]);
  return new Promise((res, rej) => {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, 'utf8', (err, token) => {
      if (err) return getAccessToken(oAuth2Client);
      oAuth2Client.setCredentials(JSON.parse(token));
      res(oAuth2Client)
    });
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client: OAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err: { message: any; }, token: any) => {
      if (err) return err.message;
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      return oAuth2Client;
    });
  });
}
