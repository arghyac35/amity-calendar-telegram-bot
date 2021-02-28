import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import GoogleCalendarService from '../../services/googleCalendar';
import { Logger } from 'winston';
import config from '../../config';
import { Telegraf } from 'telegraf'

const route = Router();

export default (app: Router) => {
  app.use('/botUpdates', route);

  route.post(`/${config.tgBotToken}`, async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger');
    logger.debug('Calling botUpdates endpoint')
    try {
      const bot = Container.get('tgBot') as Telegraf;

      return bot.handleUpdate(req.body, res)

    } catch (e) {
      logger.error('🔥 error: %o', e);
      return next(e);
    }
  });

  route.get(`/getTodaysClass/${config.tgBotToken}`, async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger');
    logger.debug('Calling getTodaysClass endpoint')
    try {
      const calendarServiceInstance = Container.get(GoogleCalendarService);
      const message = await calendarServiceInstance.getTodaysEvents();

      const bot = Container.get('tgBot') as Telegraf;
      let authChats = config.authorizedChats ? config.authorizedChats.split(',').map(chatId => Number(chatId)) : []
      for (let index = 0; index < authChats.length; index++) {
        const element = authChats[index];
        await bot.telegram.sendMessage(element, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
      }
      res.sendStatus(200);
    } catch (e) {
      logger.error('🔥 error: %o', e);
      return next(e);
    }
  });
};
