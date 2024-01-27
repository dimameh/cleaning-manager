import mongoose, { Schema, Types } from 'mongoose';

const ObjectId = Schema.ObjectId;

export interface IUserInfo {
  _id: Types.ObjectId;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export const UserInfoSchema = new Schema<IUserInfo>({
  _id: ObjectId,
  username: { type: String, required: false },
  first_name: { type: String, required: false },
  last_name: { type: String, required: false }
});

export class UserInfoController {
  private static _model = mongoose.model('userInfo', UserInfoSchema);

  public static create(toAdd: IUserInfo) {
    return this._model.create(toAdd);
  }

  public static remove(_id: IUserInfo['_id']) {
    return this._model.findOneAndDelete({ _id });
  }
}
