import { Telegraf } from 'telegraf';
import { config } from 'dotenv';

config();

if (!process.env.BOT_TOKEN) {
  console.error('BOT_TOKEN is not defined!');
  process.exit(1);
}

const bot: Telegraf = new Telegraf(process.env.BOT_TOKEN);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;
