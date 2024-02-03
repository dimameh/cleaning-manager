import mongoose, { Schema, Types, Document } from 'mongoose';
const ObjectId = Schema.ObjectId;

export interface IChat extends Document {
  chatId: number;
  isActive: boolean;
  userInfoId: Types.ObjectId;
  taskListId: Types.ObjectId;
}

const ChatSchema = new Schema<IChat>({
  chatId: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, required: true },
  userInfoId: { type: ObjectId, ref: 'UserInfo' },
  taskListId: { type: ObjectId, ref: 'TaskList' },
});

const Chat = mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
