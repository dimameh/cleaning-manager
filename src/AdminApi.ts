import express, { Express } from 'express';
import Bot from './Bot';
import Chat, { IChat } from './DB/entities/Chat';
import { config } from 'dotenv';
import bodyParser from 'body-parser';

config();

if (!process.env.API_PORT) {
  console.error('API_PORT is not defined!');
  process.exit(1);
}

const app: Express = express();

app.use(bodyParser.json());

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

  res.send('Done!');
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

  res.send('Done!');
});

app.get('/healthcheck', (req, res) => {
  res.send('All good!');
});

export default app;
