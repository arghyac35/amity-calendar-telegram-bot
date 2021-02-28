import { Container } from 'typedi';
import LoggerInstance from './logger';
import config from '../config';


export default async (): Promise<any> => {
  try {
    Container.set('logger', LoggerInstance)
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
