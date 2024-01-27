import mongoose, { Schema, Types } from 'mongoose';

export interface ITaskList {
  _id: Types.ObjectId;
  title: string;
}

export const TaskListSchema = new Schema<ITaskList>({
  title: { type: String, required: true }
});

export class TaskListController {
  private static _model = mongoose.model('taskList', TaskListSchema);

  public static create(toAdd: ITaskList) {
    return this._model.create(toAdd);
  }

  public static remove(_id: ITaskList['_id']) {
    return this._model.findOneAndDelete({ _id });
  }
}
