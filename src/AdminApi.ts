import express, { Express } from 'express';
import Bot from './Bot';
import Chat, { IChat } from './DB/entities/Chat';
import { config } from 'dotenv';
import bodyParser from 'body-parser';
import TaskScheduler from './Scheduler';

config();

if (!process.env.PORT || !process.env.ADMIN_PASS) {
  console.error('PORT or ADMIN_PASS is not defined!');
  process.exit(1);
}

const app: Express = express();

app.use(bodyParser.json());

app.use(function(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  }

  if (req.headers.authorization !== process.env.ADMIN_PASS) {
    return res.status(403).json({ error: 'Wrong credentials!' });
  }
  next();
});

app.post('/enforceNewTask', async (req, res) => {
  await TaskScheduler.generateAndRunTask();
  res.json('Done!');
});
//test as 
asd

app.post('/sendMessageToAll', async (req, res) => {
  let chats: IChat[] = [];
  try {
    chats = await Chat.find();
  } catch (error) {
    console.error('Error getting all chats:', error);
    res.send('Error getting all chats');
  }

  chats.forEach((chat) => {
    Bot.telegram.sendMessage(chat.chatId, req.body.message);
  });

  res.json('Done!');
});

app.post('/sendMessageTo/:chatId', async (req, res) => {
  let chat: IChat | null = null;
  try {
    chat = await Chat.findOne({ chatId: req.params.chatId });
    if (!chat) {
      res.send('Chat not found');
      return;
    }
  } catch (error) {
    console.error('Error getting chat:', error);
    res.send('Error getting chat');
  }

  Bot.telegram.sendMessage(req.params.chatId, req.body.message);

  res.json('Done!');
});

app.get('/healthcheck', (req, res) => {
  res.json('All good!');
});

export default app;
