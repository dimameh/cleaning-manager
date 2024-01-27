import mongoose, { Schema, Types } from 'mongoose';

const ObjectId = Schema.ObjectId;

export interface IChat {
  chatId: number;
  userInfoId: Types.ObjectId;
  taskListId: Types.ObjectId;
}

export const ChatSchema = new Schema<IChat>({
  chatId: { type: Number, required: true, unique: true },
  userInfoId: { type: ObjectId, ref: 'UserInfo' },
  taskListId: { type: ObjectId, ref: 'TaskList' },
});

export class UserController {
  private static _model = mongoose.model('chat', ChatSchema);

  public static create(toAdd: IChat) {
    return this._model.create(toAdd);
  }

  public static remove(chatId: IChat['chatId']) {
    return this._model.findOneAndDelete({ chatId });
  }

  public static getActiveChats() {
    return this._model.find();
  }
}
