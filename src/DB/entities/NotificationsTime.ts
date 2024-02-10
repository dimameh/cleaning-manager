import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import { TimeString } from 'src/utils/types';
const ObjectId = Schema.ObjectId;

export interface INotificationsTime extends Document {
  utcTime: TimeString;
  chatId: Types.ObjectId;
}

interface INotificationsTimeModel extends Model<INotificationsTime> {
  getNotificationsTime(
    utcTime: TimeString
  ): Promise<INotificationsTime['chatId'][]>;
}

const NotificationsTimeSchema = new Schema<INotificationsTime>({
  chatId: { type: ObjectId, required: true, ref: 'Chat' },
  utcTime: {
    type: String,
    required: true,
    validate: {
      validator: function (time: string) {
        return /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/.test(time);
      },
      message: (props) =>
        `${props.value} is not a valid time format (HH:MM Москва)!`
    }
  }
});

NotificationsTimeSchema.statics.getNotificationsTime = async function (
  utcTime: TimeString
): Promise<INotificationsTime['chatId'][]> {
  const notificationsTime = await this.find({ utcTime });
  return notificationsTime.map((notification) => notification.chatId);
};

const NotificationsTime = mongoose.model<
  INotificationsTime,
  INotificationsTimeModel
>('NotificationsTime', NotificationsTimeSchema, 'NotificationsTime');

export default NotificationsTime;
