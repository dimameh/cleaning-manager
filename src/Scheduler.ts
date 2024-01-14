import fs from 'fs';
import { Task } from './Task';
import { SchedulerSerialized } from './types';
import path from 'path';

export class TaskScheduler {
  private _tasks: Task[];
  private _lastTasksTitles: [string?, string?, string?, string?, string?];

  constructor();
  constructor(tasks: string[]);

  constructor(tasks?: string[]) {
    if (!fs.existsSync( path.join(__dirname, 'state'))) {
      fs.mkdirSync( path.join(__dirname, 'state'));
    }
    if (!tasks) {
      try {
        this.loadCurrentState();
      } catch (error) {
        const errorMessage = 'Не удалось загрузить Scheduler. Проверьте, что файл SchedulerState.json существует и содержит корректные данные.';
      
        console.error(errorMessage);
        throw new Error(
          errorMessage
        );
      }
      return;
    }

    this._tasks = tasks.map((task) => new Task(task));

    // простой способ избавиться от лишней проверки при выборе таски
    this._lastTasksTitles = new Array(5) as any;
  }

  chooseTask(): Task {
    this.updateWeights();

    // Фильтрация задач, чтобы не повторять задачу подряд
    const filteredTasks = this._tasks.filter(
      (task) => !this._lastTasksTitles.includes(task.title)
    );

    // Проверка на задачи, которые не выполнялись более двух недель
    const overdueTask = filteredTasks.find((task) => task.weight > 14);
    if (overdueTask) {
      return overdueTask.getPreparedForMessageTask();
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
        this._lastTasksTitles.push(task.title);
        this._lastTasksTitles.shift();
        return task.getPreparedForMessageTask();
      }
    }

    // Возвращаем первую задачу из отфильтрованного списка, если другие условия не выполняются
    const firstTask = filteredTasks[0];
    this._lastTasksTitles.push(firstTask.title);
    this._lastTasksTitles.shift();
    return firstTask.getPreparedForMessageTask();
  }

  completeTask(taskTitle: string) {
    const task = this._tasks.find((task) => task.title === taskTitle);
    if (task) {
      task.lastCompleted = new Date();
      task.weight = 0;
    }
    this.saveCurrentState();
  }

  logCurrentState() {
    console.log({ tasks: this._tasks, lastTasksTitles: this._lastTasksTitles });
  }

  private updateWeights() {
    this._tasks.forEach((task) => task.updateWeight());
    this.saveCurrentState();
  }

  private saveCurrentState() {
    console.log('Сохраняем состояние в файл:', path.join(__dirname, 'state', 'SchedulerState.json'))
    fs.writeFileSync(
        path.join(__dirname, 'state', 'SchedulerState.json'),
      JSON.stringify({
        tasks: this._tasks.map((task) => task.getSerialized()),
        lastTasksTitles: this._lastTasksTitles,
      })
    );
  }

  private loadCurrentState() {
    console.log('Загружаем состояние из файла:', path.join(__dirname, 'state', 'SchedulerState.json'))
    const state = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, 'state', 'SchedulerState.json'),
        'utf-8'
      )
    ) as SchedulerSerialized;

    this._tasks = state.tasks.map((task) => new Task(task.title, task));
    this._lastTasksTitles = state.lastTasksTitles;
  }
}
