import { Worker, isMainThread } from 'worker_threads';
import { WorkerOptions, WorkerProcessType } from '../types/Worker';

import Constants from '../utils/Constants';
import { PoolOptions } from 'poolifier';
import WorkerAbstract from './WorkerAbstract';
import WorkerStaticPool from './WorkerStaticPool';

export default class WorkerFactory {
  private constructor() {
    // This is intentional
  }

  public static getWorkerImplementation<T>(workerScript: string, workerProcessType: WorkerProcessType, options?: WorkerOptions): WorkerAbstract | null {
    if (!isMainThread) {
      throw new Error('Trying to get a worker implementation outside the main thread');
    }
    options = options ?? {} as WorkerOptions;
    options.startDelay = options?.startDelay ?? Constants.WORKER_START_DELAY;
    options.poolOptions = options?.poolOptions ?? {} as PoolOptions<Worker>;
    options?.messageHandler && (options.poolOptions.messageHandler = options.messageHandler);
    let workerImplementation: WorkerAbstract = null;
    switch (workerProcessType) {
      case WorkerProcessType.STATIC_POOL:
        options.poolMaxSize = options.poolMaxSize ?? Constants.DEFAULT_WORKER_POOL_MAX_SIZE;
        workerImplementation = new WorkerStaticPool<T>(workerScript, options.poolMaxSize, options.startDelay, options.poolOptions);
        break;
      default:
        throw new Error(`Worker implementation type '${workerProcessType}' not found`);
    }
    return workerImplementation;
  }
}
