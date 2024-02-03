import { TaskScheduler } from './entities/Scheduler';
import TodoListInitial from './config/TodoList.json';
import MessagesMap from './config/MessagesMap.json';
import { shuffle } from './utils';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { ChatIdManager } from './entities/ChatIdsManager';
import { config } from 'dotenv';
import { initDB } from './DB';
import TaskList from './DB/entities/TaskList';
import { ITask } from './DB/entities/Task';

config();

let bot: Telegraf;
let taskScheduler: TaskScheduler;
let currentTask: ITask;
const chatIdManager = new ChatIdManager();

initEverything();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

process.env.USE_CRON === 'FALSE'
  ? setInterval(checkTimeAndRunFunction, 60000)
  : sendNewTask();

async function initEverything() {
  initBot();
  await initDB();
  const taskList = await TaskList.findOne({});
  taskScheduler = new TaskScheduler(taskList?.id);
}

function initBot() {
  if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN is not defined!');
    process.exit(1);
  }
  bot = new Telegraf(process.env.BOT_TOKEN);
  bot.start(onStart);

  bot.on(message('sticker'), (ctx) => ctx.reply('Вау, ахуеть! 👍'));
  bot.hears('Текущая задача', (ctx) => getCurrentTask(ctx));
  bot.hears('/currentTask', (ctx) => getCurrentTask(ctx));
  bot.hears('Отключи меня', (ctx) => removeUser(ctx));
  bot.hears('/turnOff', (ctx) => removeUser(ctx));

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
      messageObj
    });
    taskScheduler.completeTask(currentTask.title);
    return;
  }

  console.log('Отправляем новую задачу', { messageObj });

  const { descriptions } = messageObj;

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
    timeZone: 'Asia/Almaty'
  });
  const currentTime = new Date(astanaTime);

  // Проверяем, соответствует ли время 14:00
  if (currentTime.getHours() === 14 && currentTime.getMinutes() === 0) {
    sendNewTask();
  }
}

function getCurrentTask(ctx) {
  console.log('123');
  const messageObj = MessagesMap.find(
    (el) => el.title === currentTask.finalTitle
  );
  if (!messageObj) {
    console.error('Не найден текст для задачи. Fak.', {
      finalTitle: currentTask.finalTitle,
      title: currentTask.title,
      messageObj
    });
    ctx.reply('Не могу найти текст для задачи. Fak.');
    return;
  }
  ctx.reply(messageObj.descriptions);
}

function removeUser(ctx) {
  chatIdManager.removeChat(ctx.chat.id);
  ctx.reply(
    'Окей, грязная вонючка, я больше не буду тебе писать. Если передумаешь вонять, напиши /start'
  );
}

function onStart(ctx) {
  ctx.reply(
    'Привет! Я твой клининг менеджер. Я подскажу тебе когда и что убрать в твоей квартире.'
  );
  chatIdManager.addChat(ctx.chat.id);
}
