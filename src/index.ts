import { TaskScheduler } from './Scheduler';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from 'dotenv';
import { initDB } from './DB';
import TaskList from './DB/entities/TaskList';
import { ITask } from './DB/entities/Task';
import Chat from './DB/entities/Chat';
import { isValidOnStartContext } from './utils';

config();

let bot: Telegraf;
let taskScheduler: TaskScheduler;
let currentTask: ITask;

initEverything();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

process.env.USE_CRON === 'FALSE'
  ? setInterval(checkTimeAndRunFunction, 60000)
  : sendNewTask();

async function initEverything() {
  await initBot();
  console.log('bot is ready');
  await initDB();
  console.log('DB is ready');
  const taskList = await TaskList.findOne({});
  taskScheduler = new TaskScheduler();
  await taskScheduler.init(taskList?.id);
  console.log('Task Scheduler is ready');
}

async function initBot() {
  if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN is not defined!');
    process.exit(1);
  }
  bot = new Telegraf(process.env.BOT_TOKEN);

  bot.start(onStart);

  bot.on(message('sticker'), (ctx) => ctx.reply('Вау, ахуеть! 👍'));

  bot.hears('Текущая задача', getCurrentTask);
  bot.hears('/currentTask', getCurrentTask);

  bot.hears('Отключи меня', removeUser);
  bot.hears('/turnOff', removeUser);

  bot.launch();
}

async function sendNewTask() {
  currentTask = await taskScheduler.generateTask();
  console.log('Sending new task', { currentTask });

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

async function getCurrentTask(ctx) {
  const chat = await Chat.findOne({ chatId: ctx.chat.id });
  if (!chat) {
    ctx.reply('Куда! Нажмешь /start - и получишь задание!');
    return;
  }

  if (chat.isActive === false) {
    ctx.reply(
      'Соре, задания тут вонючкам не выдают. Хочешь перестать вонять? Нажми /start а там уже посмотрим.'
    );
    return;
  }

  if (!currentTask) {
    ctx.reply(
      'Пока что нет задачи. Но скоро будет! А пока выметайся от сюда 🧹'
    );
    return;
  }
  ctx.reply(currentTask.message);
}

async function removeUser(ctx) {
  try {
    const chat = await Chat.findOne({ chatId: ctx.chat.id });
    if (!chat) {
      console.error('Error removing user, chat not found');
      ctx.reply(
        'Что-то пошло не так, попробуй еще раз. Если не получится - плюнь, заблокируй бота и съешь конфетку.'
      );
      return;
    }

    if (!chat.isActive) {
      ctx.reply(
        'Да понял я что не надо тебе писать. Я же тебе уже не пишу. Если передумаешь вонять, напиши /start. А если я все таки пишу, ну соре, что-то пошло не так. Заблокируй бота и съешь конфетку.'
      );
      return;
    }

    await Chat.updateOne({ chatId: ctx.chat.id }, { isActive: false });
    ctx.reply(
      'Окей, грязная вонючка, я больше не буду тебе писать 💩. Если передумаешь вонять, напиши /start'
    );
  } catch (err) {
    console.error('Error removing user', err);
    ctx.reply(
      'Что-то пошло не так, попробуй еще раз. Если не получится - плюнь, заблокируй бота и съешь конфетку.'
    );
  }
}

async function onStart(ctx) {
  console.log('Start command initiated');
  const { chat, from } = ctx.update.message;

  if (!isValidOnStartContext(ctx)) {
    console.error(
      'Error getting chat id in onStart handler. ctx:',
      JSON.stringify(ctx)
    );
    ctx.reply(
      'Привет! У тебя какой-то странный чат. Я такого не ожидал! Но посмотрю что с этим можно сделать в ближайшее время.'
    );
    return;
  }

  const chatEntity = await Chat.findOne({ chatId: chat.id });
  if (!chatEntity) {
    console.log('User not found, creating new chat');

    try {
      await Chat.createNewChat(chat.id, from);
      ctx.reply(
        'Привет! Я твой клининг менеджер. Я подскажу тебе когда и что убрать в твоей квартире. Команды можешь найти в описании. Приятного пользования! 🧹'
      );
    } catch (err) {
      console.error('Error creating new chat', err);
      console.error('Error data', { chatId: chat.id, from });
    }
  } else if (!chatEntity.isActive) {
    await Chat.updateOne({ chatId: ctx.chat.id }, { isActive: true });
    ctx.reply(
      'Какие люди в голивуде! Уже успел засраться без меня! Ну добро пожаловать, дружище 🥸'
    );
  } else {
    ctx.reply(
      'Дружок пирожок, хватит жмакать по старту, я тут и так работаю. Если что, напиши /currentTask и я тебе напомню текущую задачу.'
    );
  }
}
