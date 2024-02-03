import mongoose, { Schema, Types, Document } from 'mongoose';
const ObjectId = Schema.ObjectId;

export interface IChat extends Document {
  chatId: number;
  userInfoId: Types.ObjectId;
  taskListId: Types.ObjectId;
}

export const ChatSchema = new Schema<IChat>({
  chatId: { type: Number, required: true, unique: true },
  userInfoId: { type: ObjectId, ref: 'UserInfo' },
  taskListId: { type: ObjectId, ref: 'TaskList' },
});

const Chat = mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
