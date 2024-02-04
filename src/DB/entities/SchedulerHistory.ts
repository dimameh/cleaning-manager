import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import { wait } from '../../utils';
import { LastTasksIds } from '../../utils/types';

const ObjectId = Schema.ObjectId;

export interface ISchedulerHistory extends Document {
  lastTaskIds: LastTasksIds;
  currentTask: Types.ObjectId;
}

interface ISchedulerHistoryModel extends Model<ISchedulerHistory> {
  updateLastTasks(newTaskId: Types.ObjectId): Promise<void>;
  getLastTasks(): Promise<LastTasksIds>;
  updateCurrentTask(taskId: Types.ObjectId): Promise<void>;
  getCurrentTask(): Promise<Types.ObjectId | null>;
}

const SchedulerHistorySchema = new Schema<ISchedulerHistory>({
  lastTaskIds: { type: [ObjectId], required: true, ref: 'Task' },
  currentTask: { type: ObjectId, required: true, ref: 'Task' }
});

SchedulerHistorySchema.statics.updateLastTasks = async function (
  newTaskId: Types.ObjectId
) {
  const schedulerHistory = await this.findOneAndUpdate(
    {},
    {
      // Добавление нового ID в начало массива
      $push: { lastTaskIds: { $each: [newTaskId], $position: 0 } }
    },
    { upsert: true, new: true }
  );

  // Если в массиве более 5 задач, удаляем самую старую (последнюю в массиве)
  if (schedulerHistory.lastTaskIds.length > 5) {
    await this.updateOne(
      {},
      {
        $pop: { lastTaskIds: 1 }
      }
    );
  }
};

SchedulerHistorySchema.statics.getLastTasks = async function () {
  const record = await this.findOne({});
  return record?.lastTaskIds || [];
};

SchedulerHistorySchema.statics.updateCurrentTask = async function (
  taskId: Types.ObjectId
) {
  await this.findOneAndUpdate({}, { currentTask: taskId });
};


SchedulerHistorySchema.statics.getCurrentTask = async function () {
  const record = await this.findOne({});
  return record?.currentTask || null;
};

const SchedulerHistory = mongoose.model<
  ISchedulerHistory,
  ISchedulerHistoryModel
>('SchedulerHistory', SchedulerHistorySchema, 'SchedulerHistory');

export default SchedulerHistory;
