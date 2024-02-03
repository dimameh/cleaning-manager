import TaskList, { ITaskList } from './DB/entities/TaskList';
import Task, { ITask } from './DB/entities/Task';
import SchedulerHistory from './DB/entities/SchedulerHistory';

export class TaskScheduler {
  private _tasks: ITask[];
  private _readyForNextTask = true;

  constructor() {}

  async init(taskListId: ITaskList['id']) {
    try {
      await this._loadTasks(taskListId);
    } catch (error) {
      const errorMessage = 'Не удалось загрузить список задач.';
      console.error(errorMessage, error);
    }
  }

  async generateTask(): Promise<ITask> {
    // prevent parallel documents saving (weights for tasks)
    if (!this._readyForNextTask) {
      throw new Error('TaskScheduler is not ready for next task.');
    }
    this._readyForNextTask = false;
    const task = await this._getNextTask();
    await task.completeTask();
    await SchedulerHistory.updateLastTasks(task?.id);
    this._readyForNextTask = true;
    return task;
  }

  private async _getNextTask(): Promise<ITask> {
    await this._updateWeights();
    const lastTasksIds = await SchedulerHistory.getLastTasks();
    // Фильтрация задач, чтобы не повторять задачу подряд
    const filteredTasks = this._tasks.filter(
      (task) => !lastTasksIds.includes(task._id)
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

    const maxWeight = filteredTasks.reduce(
      (max, task) => Math.max(max, task.weight),
      -Infinity
    );

    // Фильтруем задачи, у которых вес равен максимальному
    const maxWeightTasks = filteredTasks.filter(
      (task) => task.weight === maxWeight
    );
    return maxWeightTasks[0];
  }

  private async _updateWeights() {
    const promises = this._tasks.map((task) =>
      task.updateWeight((lastCompleted) => {
        const now = new Date();
        // Количество дней с момента последнего выполнения задачи будет ее новым весом
        const daysSinceCompletion = Math.floor(
          (now.getTime() - lastCompleted.getTime()) / (1000 * 3600 * 24)
        );
        return daysSinceCompletion;
      })
    );

    return Promise.all(promises);
  }

  private async _loadTasks(taskListId: ITaskList['id']) {
    const taskListResult = await TaskList.findById(taskListId);
    if (!taskListResult) {
      throw new Error('Task list not found');
    }

    this._tasks = await Task.find({ taskListId });
  }
}
