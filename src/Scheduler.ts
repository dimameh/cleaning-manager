import TaskList, { ITaskList } from './DB/entities/TaskList';
import Task, { ITask } from './DB/entities/Task';
import SchedulerHistory from './DB/entities/SchedulerHistory';
import { LastTasksIds } from './utils/types';
import { shuffle } from './utils';

export class TaskScheduler {
  private _tasks: ITask[];
  private _lastTasksIds: Readonly<LastTasksIds>;

  constructor(taskListId: ITaskList['id']) {
    try {
      this._loadTasks(taskListId);
    } catch (error) {
      const errorMessage = 'Не удалось загрузить список задач.';
      console.error(errorMessage, error);
    }
  }

  async chooseTask(): Promise<ITask> {
    const task = await this._getNextTask();
    task.completeTask();
    await SchedulerHistory.updateLastTasks(task?.id);
    return task;
  }

  private async _getNextTask(): Promise<ITask> {
    await this._updateWeights();

    const lastTaskIdsString = this._lastTasksIds.map((el) => el?.id);
    // Фильтрация задач, чтобы не повторять задачу подряд
    const filteredTasks = this._tasks.filter(
      (task) => !lastTaskIdsString.includes(task.id)
    );
    // Проверка на задачи, которые не выполнялись более двух недель
    const overdueTask = filteredTasks.find((task) => task.weight > 14);
    if (overdueTask) {
      return overdueTask;
    }

    // Взвешенный случайный выбор
    const totalWeight = filteredTasks.reduce(
      (sum, task) => sum + task.weight,
      0
    );
    let randomValue = Math.random() * totalWeight;

    for (const task of filteredTasks) {
      randomValue -= task.weight;
      if (randomValue <= 0) {
        return task;
      }
    }

    // Возвращаем первую задачу из отфильтрованного списка, если другие условия не выполняются
    const firstTask = shuffle(filteredTasks)[0];
    return firstTask;
  }

  private async _updateWeights() {
    const promises = this._tasks.map((task) =>
      task.updateWeight((lastCompleted) => {
        const now = new Date();
        const daysSinceCompletion = Math.floor(
          (now.getTime() - lastCompleted.getTime()) / (1000 * 3600 * 24)
        );
        return daysSinceCompletion;
      })
    );

    return Promise.all(promises);
  }

  private async _loadTasks(taskListId: ITaskList['id']) {
    this._lastTasksIds = SchedulerHistory.lastTaskIds;

    const taskListResult = await TaskList.findById(taskListId);
    if (!taskListResult) {
      throw new Error('Task list not found');
    }

    this._tasks = await Task.find({ taskListId });
  }
}
