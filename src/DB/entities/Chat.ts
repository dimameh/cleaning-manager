import mongoose, { Schema, Types, Document } from 'mongoose';
const ObjectId = Schema.ObjectId;

interface IChat extends Document {
  chatId: number;
  userInfoId: Types.ObjectId;
  taskListId: Types.ObjectId;
}

const ChatSchema = new Schema<IChat>({
  chatId: { type: Number, required: true, unique: true },
  userInfoId: { type: ObjectId, ref: 'UserInfo' },
  taskListId: { type: ObjectId, ref: 'TaskList' },
});

const Chat = mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
