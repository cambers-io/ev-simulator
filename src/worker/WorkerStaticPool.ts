import { FixedThreadPool, PoolOptions } from 'poolifier';
import Utils from '../utils/Utils';
import { Worker } from 'worker_threads';
import { WorkerData } from '../types/Worker';
import { WorkerUtils } from './WorkerUtils';

export default class WorkerStaticPool<T> {
  private pool: FixedThreadPool<WorkerData>;
  private workerScript: string;
  private workerStartDelay?: number;

  /**
   * Create a new `WorkerStaticPool`.
   *
   * @param workerScript
   * @param numberOfThreads
   * @param startWorkerDelay
   * @param opts
   */
  constructor(
      workerScript: string,
      numberOfThreads: number,
      startWorkerDelay?: number,
      opts?: PoolOptions<Worker>
  ) {
    this.workerScript = workerScript;
    this.workerStartDelay = startWorkerDelay;

    opts = opts || {};
    opts.exitHandler = opts.exitHandler ?? WorkerUtils.defaultExitHandler;

    this.pool = new FixedThreadPool(numberOfThreads, this.workerScript, opts);
  }

  get size(): number {
    return this.pool.workers.length;
  }

  get maxElementsPerWorker(): number | null {
    return null;
  }

  public async start(): Promise<void> {
    // This is intentional
  }

  public async stop(): Promise<void> {
    return this.pool.destroy();
  }

  public async addElement(elementData: T): Promise<void> {
    await this.pool.execute(elementData);
    await Utils.sleep(this.workerStartDelay);
  }
}
