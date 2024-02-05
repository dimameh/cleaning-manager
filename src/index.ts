import TaskScheduler from './Scheduler';
import Bot from './Bot';
import { message } from 'telegraf/filters';
import { initDB } from './DB';
import TaskList from './DB/entities/TaskList';
import { ITask } from './DB/entities/Task';
import Chat from './DB/entities/Chat';
import { isValidOnStartContext } from './utils';
import Server from './AdminApi';
import { config } from 'dotenv';

config();

initEverything();

process.once('SIGINT', () => Bot.stop('SIGINT'));
process.once('SIGTERM', () => Bot.stop('SIGTERM'));

async function initEverything() {
  await initBot();
  console.log('Bot ready');
  await initDB();
  console.log('MongoDB ready');
  const taskList = await TaskList.findOne({});
  await TaskScheduler.init(taskList?.id, sendNewTask);
  console.log('Task Scheduler ready');
  Server.listen(process.env.API_PORT, () => {
    console.log(
      `Admin server ready. Listening on port ${process.env.API_PORT}`
    );
  });
}

async function initBot() {
  Bot.start(onStart);

  Bot.on(message('sticker'), (ctx) => ctx.reply('Вау, ахуеть! 👍'));

  Bot.hears('Текущая задача', getCurrentTask);
  Bot.hears('/currentTask', getCurrentTask);

  Bot.hears('Отключи меня', removeUser);
  Bot.hears('/turnOff', removeUser);

  Bot.launch();
}

async function sendNewTask(newTask: ITask) {
  console.log('Sending new task', { currentTask: TaskScheduler.currentTask });

  (await Chat.find()).forEach((chat) => {
    Bot.telegram.sendMessage(chat.chatId, TaskScheduler.currentTask.message);
  });
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

  // deprecated но на всякий случай пока оставлю
  if (!TaskScheduler.currentTask) {
    ctx.reply(
      'Пока что нет задачи. Но скоро будет! А пока выметайся от сюда 🧹'
    );
    return;
  }
  ctx.reply(TaskScheduler.currentTask.message);
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
