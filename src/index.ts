import { TaskScheduler } from './Scheduler';
import TodoListInitial from './config/TodoList.json';
import MessagesMap from './config/MessagesMap.json';
import { shuffle } from './utils';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Task } from './Task';
import { ChatIdManager } from './ChatIdsManager';
import { config } from 'dotenv';

config();

let bot: Telegraf;
let taskScheduler: TaskScheduler;
let currentTask: Task;
const chatIdManager = new ChatIdManager();

initEverything();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

process.env.USE_CRON === 'FALSE' ? setInterval(checkTimeAndRunFunction, 60000) : sendNewTask();

function initEverything() {
  initBot();
  try {
    taskScheduler = new TaskScheduler();
  } catch (err) {
    console.log('Создаем новый Scheduler');
    taskScheduler = new TaskScheduler(shuffle(TodoListInitial));
  }
  sendNewTask();
}

function initBot() {
  if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN is not defined!');
    process.exit(1);
  }
  bot = new Telegraf(process.env.BOT_TOKEN);
  bot.start((ctx) => {
    ctx.reply(
      'Привет! Я твой клининг менеджер. Я подкажу тебе когда и что убрать в твоей квартире.'
    );
    chatIdManager.addChat(ctx.chat.id);
  });

  bot.on(message('sticker'), (ctx) => ctx.reply('Вау, ахуеть! 👍'));

  bot.hears('Текущая задача', (ctx) => {
    const messageObj = MessagesMap.find(
      (el) => el.title === currentTask.finalTitle
    );
    if (!messageObj) {
      console.error('Не найден текст для задачи. Fak.', {
        finalTitle: currentTask.finalTitle,
        title: currentTask.title,
        messageObj,
      });
      ctx.reply('Не могу найти текст для задачи. Fak.')
      return;
    }
    ctx.reply(messageObj.descriptions)
  });

  bot.hears('Отключи меня', (ctx) => {
    chatIdManager.removeChat(ctx.chat.id);
    ctx.reply(
      'Окей, грязная вонючка, я больше не буду тебе писать. Если передумаешь вонять, напиши /start'
    );
  });

  bot.launch();
}

function sendNewTask() {
  currentTask = taskScheduler.chooseTask();
  const messageObj = MessagesMap.find(
    (el) => el.title === currentTask.finalTitle
  );

  if (!messageObj) {
    console.error('Не найден текст для задачи. Fak.', {
      finalTitle: currentTask.finalTitle,
      title: currentTask.title,
      messageObj,
    });
    taskScheduler.completeTask(currentTask.title);
    return;
  }

  console.log({ messageObj });

  const { title, descriptions } = messageObj;

  chatIdManager.getChats().forEach((chatId) => {
    bot.telegram.sendMessage(
      chatId,
      // descriptions[Math.floor(Math.random() * descriptions.length)]
      descriptions
    );
  });

  taskScheduler.completeTask(currentTask.title);
}

function checkTimeAndRunFunction() {
  // Получаем текущее время в Астане
  const astanaTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Almaty',
  });
  const currentTime = new Date(astanaTime);

  // Проверяем, соответствует ли время 14:00
  if (currentTime.getHours() === 14 && currentTime.getMinutes() === 0) {
    sendNewTask();
  }
}
