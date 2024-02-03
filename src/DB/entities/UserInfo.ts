import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInfo extends Document {
  username?: string;
  first_name?: string;
  last_name?: string;
}

export const UserInfoSchema = new Schema<IUserInfo>({
  username: { type: String, required: false },
  first_name: { type: String, required: false },
  last_name: { type: String, required: false }
});

const UserInfo = mongoose.model<IUserInfo>('UserInfo', UserInfoSchema);

export default UserInfo;