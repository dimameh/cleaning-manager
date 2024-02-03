import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInfo extends Document {
  id: number;
  username: string;
  is_bot: boolean;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

const UserInfoSchema = new Schema<IUserInfo>({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  is_bot: { type: Boolean, required: false },
  first_name: { type: String, required: false },
  last_name: { type: String, required: false },
  language_code: { type: String, required: false }
});

const UserInfo = mongoose.model<IUserInfo>(
  'UserInfo',
  UserInfoSchema,
  'UserInfo'
);

export default UserInfo;
