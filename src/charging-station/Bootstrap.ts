import {ChargingStationWorkerData, WorkerMessage, WorkerMessageEvents} from '../types/Worker';

import Configuration from '../utils/Configuration';
import Utils from '../utils/Utils';
import WorkerStaticPool from "../worker/WorkerStaticPool";

import chalk from 'chalk';
import {isMainThread} from 'worker_threads';
import path from 'path';
import {version} from '../../package.json';

export default class Bootstrap {
    private static instance: Bootstrap | null = null;
    private static workerPool: WorkerStaticPool<ChargingStationWorkerData> | null = null;
    private static numberOfChargingStations: number;
    private version: string = version;
    private started: boolean;
    private workerScript: string;

    private constructor() {
        this.started = false;
        this.workerScript = path.join(path.resolve(__dirname, '../'), 'charging-station', 'ChargingStationWorker.js');
        this.initWorkerImplementation();
        Configuration.setConfigurationChangeCallback(async () => Bootstrap.getInstance().restart());
    }

    public static getInstance(): Bootstrap {
        if (!Bootstrap.instance) {
            Bootstrap.instance = new Bootstrap();
        }
        return Bootstrap.instance;
    }

    public async start(): Promise<void> {
        if (isMainThread && !this.started) {
            try {
                Bootstrap.numberOfChargingStations = 0;
                await Bootstrap.workerPool.start();
                // Start ChargingStation object in worker thread
                if (Configuration.getStationTemplateURLs()) {
                    for (const stationURL of Configuration.getStationTemplateURLs()) {
                        try {
                            const nbStations = stationURL.numberOfStations ?? 0;
                            for (let index = 1; index <= nbStations; index++) {
                                const workerData: ChargingStationWorkerData = {
                                    index,
                                    templateFile: path.join(path.resolve(__dirname, '../'), 'assets', 'station-templates', path.basename(stationURL.file))
                                };
                                await Bootstrap.workerPool.addElement(workerData);
                                Bootstrap.numberOfChargingStations++;
                            }
                        } catch (error) {
                            console.error(chalk.red('Charging station start with template file ' + stationURL.file + ' error '), error);
                        }
                    }
                } else {
                    console.warn(chalk.yellow('No stationTemplateURLs defined in configuration, exiting'));
                }
                if (Bootstrap.numberOfChargingStations === 0) {
                    console.warn(chalk.yellow('No charging station template enabled in configuration, exiting'));
                } else {
                    console.log(chalk.green(`Charging stations simulator ${this.version} started with ${Bootstrap.numberOfChargingStations.toString()} charging station(s) and ${Utils.workerDynamicPoolInUse() ? `${Configuration.getWorkerPoolMinSize().toString()}/` : ''}${Bootstrap.workerPool.size}${Utils.workerPoolInUse() ? `/${Configuration.getWorkerPoolMaxSize().toString()}` : ''} worker(s) concurrently running in '${Configuration.getWorkerProcess()}' mode${Bootstrap.workerPool.maxElementsPerWorker ? ` (${Bootstrap.workerPool.maxElementsPerWorker} charging station(s) per worker)` : ''}`));
                }
                this.started = true;
            } catch (error) {
                console.error(chalk.red('Bootstrap start error '), error);
            }
        } else {
            console.error(chalk.red('Cannot start an already started charging stations simulator'));
        }
    }

    public async stop(): Promise<void> {
        if (isMainThread && this.started) {
            await Bootstrap.workerPool.stop();
        } else {
            console.error(chalk.red('Trying to stop the charging stations simulator while not started'));
        }
        this.started = false;
    }

    public async restart(): Promise<void> {
        await this.stop();
        this.initWorkerImplementation();
        await this.start();
    }

    private initWorkerImplementation(): void {
        let options = {
            startDelay: Configuration.getWorkerStartDelay(),
            poolMaxSize: Configuration.getWorkerPoolMaxSize(),
            poolMinSize: Configuration.getWorkerPoolMinSize(),
            elementsPerWorker: Configuration.getChargingStationsPerWorker(),
            poolOptions: {
                workerChoiceStrategy: Configuration.getWorkerPoolStrategy()
            }
        };
        Bootstrap.workerPool = new WorkerStaticPool<ChargingStationWorkerData>(this.workerScript, options.poolMaxSize, options.startDelay, options.poolOptions);

    }

    private logPrefix(): string {
        return `${Utils.logPrefix(' Bootstrap |')}`;
    }

}

