import { Container } from "typedi";
import { Telegraf, Context } from 'telegraf'
import config from "../config";
import CalendarService from './googleCalendar';

const SUDO_USERS = config.sudoUsers ? config.sudoUsers.split(',').map(userId => Number(userId)) : [];
const AUTHORIZED_CHATS = config.authorizedChats ? config.authorizedChats.split(',').map(chatId => Number(chatId)) : [];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const telegraph = require('telegraph-node')
const ph = new telegraph();

export default () => {
  const bot = Container.get('tgBot') as Telegraf<Context>;
  const calendarServiceInstance = Container.get(CalendarService);

  bot.start((ctx) => {
    if (isAuthorized(ctx.message) < 0) {
      sendUnauthorizedMessage(ctx, ctx.message);
    } else {
      sendMessage(ctx, ctx.message, 'You should know the commands already.', -1).catch(console.log);
    }
  });

  bot.hears(/^[/|.](todaysClass|tc)$/i, async (ctx) => {

    if (isAuthorized(ctx.message) < 0) {
      sendUnauthorizedMessage(ctx, ctx.message);
    } else {
      try {
        const message = await calendarServiceInstance.getTodaysEvents();
        await sendMessage(ctx, ctx.message, message, 60000);
      } catch (error) {
        sendMessage(ctx, ctx.message, error.message, 30000).catch(console.error);
      }
    }
  })

  bot.hears(/^[/|.](classFormTo|cft) (.+)/i, async (ctx) => {

    if (isAuthorized(ctx.message) < 0) {
      sendUnauthorizedMessage(ctx, ctx.message);
    } else {
      let res: { msg: any, events: any[], onstartdate: string };
      try {
        res = await calendarServiceInstance.getClassByFormToDate(ctx.match[2]);
        await sendMessage(ctx, ctx.message, res.msg, 60000);
      } catch (error) {
        if (error.message.includes('message is too long')) {
          const telegraPhContent = calendarServiceInstance.generateTelegraphContent(res.events, res.onstartdate);
          createTelegraphPage(telegraPhContent).then(telegraPhObj => {
            sendMessage(ctx, ctx.message, telegraPhObj.url, 60000).catch(console.error);
          }).catch(async error1 => {
            sendMessage(ctx, ctx.message, error1, 30000).catch(console.error);
          });
        } else {
          sendMessage(ctx, ctx.message, error.message, 30000).catch(console.error);
        }
      }
    }
  });

  bot.hears(/^[/|.](upcoming|up)$/i, async (ctx) => {

    if (isAuthorized(ctx.message) < 0) {
      sendUnauthorizedMessage(ctx, ctx.message);
    } else {
      sendMessage(ctx, ctx.message, await calendarServiceInstance.getUpcomingClass(), 60000).catch(console.log);
    }
  })
}


function isAuthorized(msg: any): number {
  if (SUDO_USERS.some(d => d === msg.from.id)) {
    return 0;
  }

  if (AUTHORIZED_CHATS.indexOf(msg.chat.id) > -1 &&
    msg.chat.all_members_are_administrators) return 2;
  if (AUTHORIZED_CHATS.indexOf(msg.chat.id) > -1) return 3;
  return -1;
}

async function sendMessage(bot: Context, msg, text: string, delay?: number, quickDeleteOriginal?: boolean) {
  if (!delay) delay = 10000;
  return new Promise((resolve, reject) => {
    bot.telegram.sendMessage(msg.chat.id, text, {
      reply_to_message_id: msg.message_id,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
      .then((res) => {
        if (delay > -1) {
          deleteMsg(bot, res, delay);
          if (quickDeleteOriginal) {
            deleteMsg(bot, msg);
          } else {
            deleteMsg(bot, msg, delay);
          }
        }
        resolve(res);
      })
      .catch((err) => {
        console.error(`sendMessage error: ${err.message}`);
        reject(err);
      });
  });
}

async function deleteMsg(bot: Context, msg, delay?: number): Promise<any> {
  if (delay) await sleep(delay);

  bot.telegram.deleteMessage(msg.chat.id, msg.message_id.toString())
    .catch(err => {
      console.log(`Failed to delete message. Does the bot have message delete permissions for this chat? ${err.message}`);
    });
}

function sendUnauthorizedMessage(bot: Context, msg): void {
  sendMessage(bot, msg, `You aren't authorized to use this bot here.`);
}

async function createTelegraphPage(content: any) {
  return ph.createPage(config.telegraphToken, 'Live class', content, {
    return_content: true,
    author_name: 'arghyac35',
    author_url: 'https://github.com/arghyac35'
  });
}
