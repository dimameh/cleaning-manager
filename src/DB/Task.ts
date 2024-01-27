import mongoose, { Schema, Types } from 'mongoose';

const ObjectId = Schema.ObjectId;

export interface ITask {
  _id: Types.ObjectId;
  simplifiedMessage: string;
  messageTextVariations: string[];
  taskListId: Types.ObjectId;
  weight: number;
  lastCompleted: string; // Date
}

export const TaskSchema = new Schema<ITask>({
  simplifiedMessage: { type: String, required: true },
  messageTextVariations: { type: [String], required: true },
  taskListId: { type: ObjectId, required: true, ref: 'TaskList' },
  weight: { type: Number, required: true },
  lastCompleted: { type: String, required: false },
});

export class TaskController {
  private static _model = mongoose.model('task', TaskSchema);

  public static create(toAdd: ITask) {
    return this._model.create(toAdd);
  }

  public static update(_id: ITask['_id'], toUpdate: Partial<ITask>) {
    this._model.findByIdAndUpdate({ _id }, toUpdate);
  }

  public static getAll(_id: ITask['_id']) {
    return this._model.find({ });
  }
}
