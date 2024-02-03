import { TaskScheduler } from './Scheduler';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from 'dotenv';
import { initDB } from './DB';
import TaskList from './DB/entities/TaskList';
import { ITask } from './DB/entities/Task';
import Chat from './DB/entities/Chat';

config();

let bot: Telegraf;
let taskScheduler: TaskScheduler;
let currentTask: ITask;

initEverything();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

process.env.USE_CRON === 'FALSE'
  ? setInterval(checkTimeAndRunFunction, 60000)
  : sendNewTask();

async function initEverything() {
  await initBot();
  await initDB();
  const taskList = await TaskList.findOne({});
  taskScheduler = new TaskScheduler(taskList?.id);
}

async function initBot() {
  if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN is not defined!');
    process.exit(1);
  }
  bot = new Telegraf(process.env.BOT_TOKEN);
  await bot
    .start(onStart)
    .on(message('sticker'), (ctx) => ctx.reply('Вау, ахуеть! 👍'))
    .hears('Текущая задача', (ctx) => getCurrentTask(ctx))
    .hears('/currentTask', (ctx) => getCurrentTask(ctx))
    .hears('Отключи меня', (ctx) => removeUser(ctx))
    .hears('/turnOff', (ctx) => removeUser(ctx))
    .launch();
}

async function sendNewTask() {
  currentTask = await taskScheduler.chooseTask();
  console.log('Отправка новой задачи', { currentTask });

  (await Chat.find()).forEach((chat) => {
    bot.telegram.sendMessage(chat.chatId, currentTask.message);
  });
}

function checkTimeAndRunFunction() {
  // Получаем текущее время в Астане
  const astanaTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Almaty'
  });
  const currentTime = new Date(astanaTime);

  // Проверяем, соответствует ли время 14:00
  if (currentTime.getHours() === 14 && currentTime.getMinutes() === 0) {
    sendNewTask();
  }
}

function getCurrentTask(ctx) {
  ctx.reply(currentTask.message);
}

async function removeUser(ctx) {
  await Chat.updateOne({ chatId: ctx.chat.id }, { isActive: false });
  ctx.reply(
    'Окей, грязная вонючка, я больше не буду тебе писать. Если передумаешь вонять, напиши /start'
  );
}

async function onStart(ctx) {
  ctx.reply(
    'Привет! Я твой клининг менеджер. Я подскажу тебе когда и что убрать в твоей квартире.'
  );

  const chat = Chat.findOne({ chatId: ctx.chat.id });

  if (!chat) {
    await Chat.create({ chatId: ctx.chat.id, isActive: true });
  } else {
    await Chat.updateOne({ chatId: ctx.chat.id }, { isActive: true });
  }
}
