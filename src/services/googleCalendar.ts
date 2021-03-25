
import { Service, Inject } from 'typedi';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import driveAuth = require('./calendar-auth');
import config from '../config';
import { Telegraf } from 'telegraf'

const wordInString = (s: string, word) => {
  // console.log('S-->', s);
  // console.log('w-->', word);
  // console.log('sssss--->', s.includes(word));
  return new RegExp('\\b' + word + '\\b', 'i').test(s)
};

@Service()
export default class GoogleCalendarService {
  constructor(
    @Inject('tgBot') private bot: Telegraf
  ) { }
  private courses = ['MASTER  OF BUSINESS ADMINISTRATION', 'MASTER OF BUSINESS ADMINISTRATION'];
  private semKey = ['Sem II', 'Sem 2', 'Sem ii', 'Semester - II', 'Sem - II', 'Semeseter II', 'Semester - ii', 'Sem - ii', 'Sem -II']

  async auth() {
    return await driveAuth.call().then(async (auth: OAuth2Client) => {
      return google.calendar({ version: 'v3', auth });
    }).catch((err: any) => {
      throw new Error('Drive auth error: ' + err);
    });
  }

  public async getTodaysEvents() {
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    const calList = await this.calendarListEvents({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    });

    const events = calList.filter(d => d.description && this.checkMyCourse(d.description));
    if (events.length) {
      return this.createTgMessage(events, start.toDateString());
    } else {
      return 'No class found for today.';
    }
  }

  public async getUpcomingClass() {
    let d = new Date();
    d.setDate(d.getDate() + 7);

    let newDate = new Date(d.toDateString());


    const calList = await this.calendarListEvents({
      timeMin: (new Date()).toISOString(),
      timeMax: newDate.toISOString(),
    });

    console.log('From__>', (new Date()).toISOString(), '   too-->', newDate.toISOString());

    const events = calList.filter(d => d.description && this.checkMyCourse(d.description));
    if (events.length) {
      return this.createTgMessage(events, 'next 7days');
    } else {
      return 'No upcoming class found.';
    }
  }

  public async getClassByFormToDate(inputDate: string) {

    if (!inputDate) {
      throw new Error('No date given');
    }

    let dates = inputDate.split(':');

    if (!dates.length) {
      throw new Error("Invalid date given");
    }

    let start = new Date();
    let end = new Date();

    if (dates[0]) {
      const splitDate = dates[0].split('-').map(d => Number(d));
      if (splitDate[2]) {
        start = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
      } else {
        start = new Date(splitDate[0], splitDate[1] - 1);
      }
    }

    if (dates[1]) {
      const splitDate = dates[1].split('-').map(d => Number(d));
      if (splitDate[2]) {
        end = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
      } else {
        end = new Date(splitDate[0], splitDate[1] - 1);
      }
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const calList = await this.calendarListEvents({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    });

    const events = calList.filter(d => d.description && this.checkMyCourse(d.description));
    if (events.length) {
      let onstartdate = start.toDateString();
      let onendDate = end.toDateString();
      if (onstartdate !== onendDate) {
        onstartdate = onstartdate + '-' + onendDate;
      }
      return { msg: this.createTgMessage(events, onstartdate), events, onstartdate };
    } else {
      throw new Error("No events found with the above date range.");
    }
  }

  private createTgMessage(eventItems: calendar_v3.Schema$Event[], date?: string) {
    let msg = `Total ${eventItems.length} class\n\n`;

    if (date) {
      msg = `Total ${eventItems.length} class on ${date}\n\n`;
    }

    eventItems.forEach(e => {
      let start: Date = null;
      if (e.start.dateTime) {
        start = new Date(e.start.dateTime);
      }
      msg += `<b>${e.summary}</b> at <b>${start ? start.toDateString() + ' ' + start.toTimeString() : ''}</b>: <a href='${e.hangoutLink}'>Meet Link</a>`;
      if (e.attachments) {
        const videoUrl = e.attachments.filter(attachment => attachment.mimeType === 'video/mp4');
        if (videoUrl.length) {
          let str = '';
          for (let index = 0; index < videoUrl.length; index++) {
            const video = videoUrl[index];
            str += `<a href='${video.fileUrl}'>Link${index + 1}</a>`;
            if (index !== videoUrl.length - 1) {
              str += ', ';
            }
          }
          msg += `\nRecordings: ${str}`;
        }
      }
      msg += `\nID: <code>${e.id}</code>\n\n`;
    });
    return msg;
  }

  private checkMyCourse(desc: string): boolean {
    // desc = desc.replace(/[\r\n]+/gm, " ");
    return this.courses.some(d => wordInString(desc.toLowerCase(), d.toLowerCase())) && this.semKey.some(d => wordInString(desc.toLowerCase(), d.toLowerCase()));
  }

  public async calendarListEvents(qs: calendar_v3.Params$Resource$Events$List) {
    const cal = await this.auth();

    const getList = (pageToken: string) => {
      return new Promise((resolve, reject) => {
        cal.events.list(
          {
            ...qs,
            calendarId: 'liveclass@amityonline.com',
            singleEvents: true,
            orderBy: 'startTime',
            pageToken
          }
          , function (err: Error, res) {
            if (err) {
              reject(err);
            }
            resolve(res);
          });
      });
    }
    const items = [];
    let pageToken: string;

    do {
      const resp = await getList(pageToken);
      items.push(...resp['data']['items']);
      pageToken = resp['data']['nextPageToken'];
    } while (pageToken);
    return items;
  }

  public generateTelegraphContent(items: calendar_v3.Schema$Event[], header: string): any[] {
    if (items.length === 0) {
      return [];
    }
    const telegraphContent: any[] = [];
    telegraphContent.push({
      "tag": "h4",
      "children": [
        `Showing class from: ${header}`,
        {
          "tag": "br"
        },
        `Total: ${items.length}`
      ]
    });
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (index !== 0) {
        telegraphContent.push(
          {
            "tag": "br"
          },
          {
            "tag": "br"
          });
      }

      let start = ''; let recordingArr: any[] = [];
      if (item.start.dateTime) {
        start = new Date(item.start.dateTime).toDateString()
      }

      if (item.attachments) {
        const videoUrl = item.attachments.filter(attachment => attachment.mimeType === 'video/mp4');
        if (videoUrl.length) {
          for (let index2 = 0; index2 < videoUrl.length; index2++) {
            const video = videoUrl[index2];

            recordingArr.push({
              "tag": "a",
              "attrs": {
                "href": video.fileUrl,
                "target": "_blank"
              },
              "children": [
                `Link${index2 + 1}, `
              ]
            });
          }
        }
      }

      telegraphContent.push("⁍",
        {
          "tag": "code",
          "children": [
            `${item.summary} at ${start}: `,
            {
              "tag": "strong",
              "children": [
                {
                  "tag": "a",
                  "attrs": {
                    "href": item.hangoutLink,
                    "target": "_blank"
                  },
                  "children": [
                    "Meet Link"
                  ]
                }
              ]
            }
          ]
        });

      if (recordingArr.length > 0) {
        recordingArr.unshift("Recordings: ")
        telegraphContent.push({
          "tag": "br"
        }, {
          "tag": "strong",
          "children": recordingArr
        });
      }

      telegraphContent.push({
        "tag": "br"
      }, {
        "tag": "code",
        "children": [`ID: ${item.id}`]
      })

    }

    return telegraphContent;
  }
}
