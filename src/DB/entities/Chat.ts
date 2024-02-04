import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import UserInfo, { IUserInfo } from './UserInfo';
import TaskList from './TaskList';
const ObjectId = Schema.ObjectId;

export interface IChat extends Document {
  chatId: number;
  isActive: boolean;
  userInfoId: Types.ObjectId;
  taskListId: Types.ObjectId;
}

interface IChatModel extends Model<IChat> {
  createNewChat(chatId: number, userInfoData: IUserInfo): Promise<IChat>;
}

const ChatSchema = new Schema<IChat>({
  chatId: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, required: true },
  userInfoId: { type: ObjectId, ref: 'UserInfo' },
  taskListId: { type: ObjectId, ref: 'TaskList' }
});

ChatSchema.statics.createNewChat = async function (
  chatId: number,
  userInfoData: IUserInfo
) {
  try {
    const userInfo = new UserInfo(userInfoData);
    await userInfo.save();

    const taskList = await TaskList.findOne({});

    if (!taskList) {
      throw new Error('TaskList not found');
    }

    const newChat = new this({
      chatId: chatId,
      isActive: true,
      userInfoId: userInfo._id,
      taskListId: taskList._id
    });

    // Сохраняем новый чат в базе данных
    await newChat.save();
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};

const Chat = mongoose.model<IChat, IChatModel>('Chat', ChatSchema, 'Chat');

export default Chat;
