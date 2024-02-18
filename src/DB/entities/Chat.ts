import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import UserInfo, { IUserInfo } from './UserInfo';
import TaskList from './TaskList';
import { TimeWithCity } from 'src/utils/types';
import NotificationsTime from './NotificationsTime';
import { timeWithCityToUTC } from 'src/utils';
const ObjectId = Schema.ObjectId;

export interface IChat extends Document {
  chatId: number;
  isActive: boolean;
  userInfoId: Types.ObjectId;
  taskListId: Types.ObjectId;
  notificationsTime: TimeWithCity[]; // 21:54 Москва
  /**
   * @param newTime time string in format HH:MM
   */
  addNotificationTime(newTime: TimeWithCity): Promise<IChat>;
  /**
   * @param timeToRemove indexes to remove
   */
  removeNotificationTime(timeToRemove: number[]): Promise<IChat>;
}

interface IChatModel extends Model<IChat> {
  createNewChat(chatId: number, userInfoData: IUserInfo): Promise<IChat>;
}

const ChatSchema = new Schema<IChat>({
  chatId: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, required: true },
  userInfoId: { type: ObjectId, ref: 'UserInfo' },
  taskListId: { type: ObjectId, ref: 'TaskList' },
  notificationsTime: {
    type: [String],
    default: ['14:00 Астана'],
    validate: [
      {
        validator: function (v: string[]) {
          return v.every((time) =>
            /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]) (Москва|Астана)$/.test(time)
          );
        },
        message: (props) =>
          `[InvalidFormat]: ${props.value} is not a valid time format (HH:MM Москва)!`
      },
      {
        validator: function (v: string[]) {
          if (v.length > 10) {
            return false;
          }
        },
        message: () => `[LengthError]: user already have 10 reminders`
      }
    ]
  }
});

ChatSchema.methods.addNotificationTime = async function (
  this: IChat,
  newTime: TimeWithCity
) {
  if (!this.notificationsTime.includes(newTime)) {
    this.notificationsTime.push(newTime);
    const mainResult = await this.save(); // Это сейвово потому что здесь валидируется также и формат времени. Если формат времени невалидный, то будет выброшено исключение

    const utcTime = timeWithCityToUTC(newTime);

    const newReminder = new NotificationsTime({
      utcTime,
      chatId: mainResult._id
    });
    await newReminder.save();

    return mainResult;
  } else {
    throw new Error(`${newTime} is already in the notifications time list`);
  }
};

ChatSchema.methods.removeNotificationTime = async function (
  this: IChat,
  timeToRemove: TimeWithCity
) {
  const index = this.notificationsTime.indexOf(timeToRemove);
  if (index > -1) {
    this.notificationsTime.splice(index, 1);
    const utcTime = timeWithCityToUTC(timeToRemove);
    await NotificationsTime.deleteOne({ chatId: this._id, utcTime });
    return this.save();
  } else {
    throw new Error(
      `${timeToRemove} is not found in the notifications time list`
    );
  }
};

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

    const utcTime = timeWithCityToUTC('14:00 Астана');

    const newReminder = new NotificationsTime({
      utcTime,
      chatId: newChat._id
    });
    await newReminder.save();

    // Сохраняем новый чат в базе данных
    return await newChat.save();
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};

const Chat = mongoose.model<IChat, IChatModel>('Chat', ChatSchema, 'Chat');

export default Chat;
