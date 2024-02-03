import mongoose, { Schema, Types, Document } from 'mongoose';

const ObjectId = Schema.ObjectId;

interface ISchedulerHistory extends Document {
  lastTaskIds: Types.ObjectId[];
}

const SchedulerHistorySchema = new Schema<ISchedulerHistory>({
  lastTaskIds: { type: [ObjectId], required: true, ref: 'Task' }
});

const SchedulerHistoryModel = mongoose.model<ISchedulerHistory>(
  'SchedulerHistory',
  SchedulerHistorySchema
);

class SchedulerHistoryProxy {
  private _lastTaskIds: Types.ObjectId[];
  constructor() {
    SchedulerHistoryModel.findOne().then((res) => {
      if (!res) {
        SchedulerHistoryModel.create({
          lastTaskIds: []
        });
        this._lastTaskIds = [];
      } else {
        this._lastTaskIds = res.lastTaskIds;
      }
    });
  }

  public async updateLastTasks(
    newTaskId: Types.ObjectId
  ): Promise<ReadonlyArray<Types.ObjectId>> {
    const schedulerHistory = await SchedulerHistoryModel.findOneAndUpdate(
      {},
      {
        // Добавление нового ID в начало массива
        $push: { lastTaskIds: { $each: [newTaskId], $position: 0 } }
      },
      { upsert: true, new: true }
    );

    // Если в массиве более 5 задач, удаляем самую старую (последнюю в массиве)
    if (schedulerHistory.lastTaskIds.length > 5) {
      await SchedulerHistoryModel.updateOne(
        {},
        {
          $pop: { lastTaskIds: 1 }
        }
      );
    }
    this._lastTaskIds = schedulerHistory.lastTaskIds;
    return this._lastTaskIds;
  }

  get lastTaskIds(): ReadonlyArray<Types.ObjectId> {
    return this._lastTaskIds;
  }
}

const SchedulerHistory = new SchedulerHistoryProxy();

export default SchedulerHistory;
