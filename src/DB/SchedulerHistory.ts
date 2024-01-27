import mongoose, { Schema, Types } from 'mongoose';

const ObjectId = Schema.ObjectId;

export interface ISchedulerHistory {
  _id: Types.ObjectId;
  lastTaskIds: Types.ObjectId[];
}

const SchedulerHistorySchema = new Schema<ISchedulerHistory>({
  lastTaskIds: { type: [ObjectId], required: true, ref: 'Task' },
});

export class TaskListController {
  private static _model = mongoose.model('taskList', SchedulerHistorySchema);

  public static async update(newTaskId: Types.ObjectId) {
    // Поиск последнего (или создание нового) документа SchedulerHistory
    const schedulerHistory = await this._model.findOneAndUpdate(
      {},
      {
        // Добавление нового ID в начало массива
        $push: { lastTaskIds: { $each: [newTaskId], $position: 0 } },
      },
      { upsert: true, new: true },
    );

    // Если в массиве более 5 задач, удаляем самую старую (последнюю в массиве)
    if (schedulerHistory.lastTaskIds.length > 5) {
      await this._model.updateOne(
        {},
        {
          $pop: { lastTaskIds: 1 },
        },
      );
    }

    return schedulerHistory;
  }

  public static get() {
    return this._model.findOne({});
  }
}
