import {
  AuthorizationStatus,
  AuthorizeResponse,
  StartTransactionResponse,
  StopTransactionReason,
  StopTransactionResponse
} from '../types/ocpp/Transaction';

import ChargingStation from './ChargingStation';
import Constants from '../utils/Constants';
import PerformanceStatistics from '../performance/PerformanceStatistics';
import Utils from '../utils/Utils';
import logger from '../utils/Logger';
import ChargingStationTemplate from '../types/ChargingStationTemplate';
import fs from 'fs';
import FileUtils from '../utils/FileUtils';
import lockfile from 'proper-lockfile';
import Statistics from '../types/Statistics';

export default class AutomaticTransactionGenerator {
  public started: boolean;
  private startDate!: Date;
  private lastRunDate!: Date;
  private stopDate!: Date;
  private chargingStation: ChargingStation;

  constructor(chargingStation: ChargingStation) {
    this.chargingStation = chargingStation;
    this.started = false;
  }

  public start(): void {
    const previousRunDuration = (this?.startDate && this?.lastRunDate) ? (this.lastRunDate.getTime() - this.startDate.getTime()) : 0;
    this.startDate = new Date();
    this.lastRunDate = this.startDate;
    this.stopDate = new Date(this.startDate.getTime()
      + (this.chargingStation.stationInfo?.AutomaticTransactionGenerator?.stopAfterHours ?? Constants.CHARGING_STATION_ATG_DEFAULT_STOP_AFTER_HOURS) * 3600 * 1000
      - previousRunDuration);
    this.started = true;
    for (const connector in this.chargingStation.connectors) {
      if (Utils.convertToInt(connector) > 0) {
        // Avoid hogging the event loop with a busy loop
        setImmediate(() => {
          this.startOnConnector(Utils.convertToInt(connector)).catch(() => { /* This is intentional */
          });
        });
      }
    }
    logger.info(this.logPrefix() + ' started and will run for ' + Utils.formatDurationMilliSeconds(this.stopDate.getTime() - this.startDate.getTime()));
  }

  public stop(): void {
    if (!this.started) {
      logger.error(`${this.logPrefix()} trying to stop while not started`);
      return;
    }
    this.started = false;
    logger.info(`${this.logPrefix()} over and lasted for ${Utils.formatDurationMilliSeconds(this.lastRunDate.getTime() - this.startDate.getTime())}. Stopping all transactions`);
    logger.info(`${this.logPrefix()} changing AutomaticTransactionGenerator to disabled`);

    let stationTemplateFromFile: ChargingStationTemplate;
    lockfile.lock(this.chargingStation.stationTemplateFile, { stale: 5000, retries: 3 })
      .then(async (release) => {
        try {
          const fileData = fs.readFileSync(this.chargingStation.stationTemplateFile, 'utf8');
          stationTemplateFromFile  = JSON.parse(fileData);
          stationTemplateFromFile.AutomaticTransactionGenerator.enable = false;
          fs.writeFileSync(this.chargingStation.stationTemplateFile, JSON.stringify(stationTemplateFromFile, null, 2), 'utf8');
        } catch (error) {
          FileUtils.handleFileException(this.logPrefix(), 'Template', this.chargingStation.stationTemplateFile, error);
        }
        await release();
      })
      .catch(() => { /* This is intentional */
      });
  }

  private async startOnConnector(connectorId: number): Promise<void> {
    logger.info(this.logPrefix(connectorId) + ' started on connector');
    const stopAfterNumberOfTransaction = this.chargingStation.stationInfo.AutomaticTransactionGenerator.stopAfterNumberOfTransaction;
    let startedTransactions = 0;
    let skippedTransactions = 0;
    let skippedTransactionsTotal = 0;

    while (this.started) {
      if ((new Date()) > this.stopDate || startedTransactions >= stopAfterNumberOfTransaction) {
        this.stop();
        break;
      }
      if (!this.chargingStation.isRegistered()) {
        logger.error(this.logPrefix(connectorId) + ' Entered in transaction loop while the charging station is not registered');
        break;
      }
      if (!this.chargingStation.isChargingStationAvailable()) {
        logger.info(this.logPrefix(connectorId) + ' Entered in transaction loop while the charging station is unavailable');
        this.stop();
        break;
      }
      if (!this.chargingStation.isConnectorAvailable(connectorId)) {
        logger.info(`${this.logPrefix(connectorId)} Entered in transaction loop while the connector ${connectorId} is unavailable, stop it`);
        break;
      }
      if (!this.chargingStation?.ocppRequestService) {
        logger.info(`${this.logPrefix(connectorId)} Transaction loop waiting for charging station service to be initialized`);
        do {
          await Utils.sleep(Constants.CHARGING_STATION_ATG_INITIALIZATION_TIME);
        } while (!this.chargingStation?.ocppRequestService);
      }
      const wait = Utils.getRandomInt(this.chargingStation.stationInfo.AutomaticTransactionGenerator.maxDelayBetweenTwoTransactions,
        this.chargingStation.stationInfo.AutomaticTransactionGenerator.minDelayBetweenTwoTransactions) * 1000;
      logger.info(this.logPrefix(connectorId) + ' waiting for ' + Utils.formatDurationMilliSeconds(wait));
      await Utils.sleep(wait);
      const start = Utils.secureRandom();
      if (start < this.chargingStation.stationInfo.AutomaticTransactionGenerator.probabilityOfStart) {
        // Start transaction
        this.chargingStation.getConnector(connectorId).batterySize = Utils.getRandomInt(this.chargingStation.stationInfo.AutomaticTransactionGenerator.minBatterySize,
          this.chargingStation.stationInfo.AutomaticTransactionGenerator.maxBatterySize);
        this.chargingStation.getConnector(connectorId).startEnergy = Utils.getRandomInt(this.chargingStation.stationInfo.AutomaticTransactionGenerator.minStartEnergy,
          this.chargingStation.stationInfo.AutomaticTransactionGenerator.maxStartEnergy);
        this.chargingStation.getConnector(connectorId).desiredEnergy = Utils.getRandomInt(this.chargingStation.stationInfo.AutomaticTransactionGenerator.minDesiredEnergy,
          this.chargingStation.stationInfo.AutomaticTransactionGenerator.maxDesiredEnergy);
        this.chargingStation.getConnector(connectorId).VIN = this.chargingStation.stationInfo.AutomaticTransactionGenerator.VIN ;

        const startResponse = await this.startTransaction(connectorId);
        startedTransactions++;
        logger.info(this.logPrefix(connectorId) + ' transactions: ' + startedTransactions.toString() + ' / ' + stopAfterNumberOfTransaction.toString());

        if (startResponse?.idTagInfo?.status !== AuthorizationStatus.ACCEPTED) {

          logger.warn(this.logPrefix(connectorId) + ' transaction rejected');
          await Utils.sleep(Constants.CHARGING_STATION_ATG_WAIT_TIME);
        } else {
          const soc = Number(this.chargingStation.getConnector(connectorId).startEnergy / this.chargingStation.getConnector(connectorId).batterySize * 100).toFixed(2);
          logger.info(this.logPrefix(connectorId) + ' batterySize: ' + this.chargingStation.getConnector(connectorId).batterySize.toString() + 'Wh at SOC: ' + soc.toString() + '%');

          // Wait until end of transaction
          const waitTrxEnd = Utils.getRandomInt(this.chargingStation.stationInfo.AutomaticTransactionGenerator.maxDuration,
            this.chargingStation.stationInfo.AutomaticTransactionGenerator.minDuration) * 1000;
          const desiredSOC = Number(this.chargingStation.getConnector(connectorId).desiredEnergy / this.chargingStation.getConnector(connectorId).batterySize * 100).toFixed(2) ;
          logger.info(this.logPrefix(connectorId) + ' transaction ' + this.chargingStation.getConnector(connectorId).transactionId.toString() + ' will stop in ' + Utils.formatDurationMilliSeconds(waitTrxEnd) + ' or when SOC reaches ' + desiredSOC.toString() + '%');
          let sleepSec = 0;
          while (waitTrxEnd / 1000 >= sleepSec && this.chargingStation.getConnector(connectorId).currentEnergy < this.chargingStation.getConnector(connectorId).desiredEnergy) {
            await Utils.sleep(1000);
            sleepSec++;
          }

          // Stop transaction
          logger.info(this.logPrefix(connectorId) + ' stop transaction ' + this.chargingStation.getConnector(connectorId).transactionId.toString());
          await this.stopTransaction(connectorId);
        }
      } else {
        skippedTransactions++;
        skippedTransactionsTotal++;
        logger.info(this.logPrefix(connectorId) + ' skipped transaction ' + skippedTransactions.toString() + '/' + skippedTransactionsTotal.toString());
      }
      this.lastRunDate = new Date();
    }
    await this.stopTransaction(connectorId);
    logger.info(this.logPrefix(connectorId) + ' stopped on connector');

  }

  private async startTransaction(connectorId: number): Promise<StartTransactionResponse | AuthorizeResponse> {
    const measureId = 'StartTransaction with ATG';
    const beginId = PerformanceStatistics.beginMeasure(measureId);
    let startResponse: StartTransactionResponse;
    if (this.chargingStation.hasAuthorizedTags()) {
      const tagId = this.chargingStation.getRandomTagId();
      if (this.chargingStation.getAutomaticTransactionGeneratorRequireAuthorize()) {
        // Authorize tagId
        const authorizeResponse = await this.chargingStation.ocppRequestService.sendAuthorize(connectorId, tagId);
        if (authorizeResponse?.idTagInfo?.status === AuthorizationStatus.ACCEPTED) {
          logger.info(this.logPrefix(connectorId) + ' start transaction for tagID ' + tagId);
          // Start transaction
          startResponse = await this.chargingStation.ocppRequestService.sendStartTransaction(connectorId, tagId);
          PerformanceStatistics.endMeasure(measureId, beginId);
          return startResponse;
        }
        PerformanceStatistics.endMeasure(measureId, beginId);
        return authorizeResponse;
      }
      logger.info(this.logPrefix(connectorId) + ' start transaction for tagID ' + tagId);
      // Start transaction
      startResponse = await this.chargingStation.ocppRequestService.sendStartTransaction(connectorId, tagId);
      PerformanceStatistics.endMeasure(measureId, beginId);
      return startResponse;
    }
    logger.info(this.logPrefix(connectorId) + ' start transaction without a tagID');
    startResponse = await this.chargingStation.ocppRequestService.sendStartTransaction(connectorId);
    PerformanceStatistics.endMeasure(measureId, beginId);
    return startResponse;
  }

  private async stopTransaction(connectorId: number, reason: StopTransactionReason = StopTransactionReason.NONE): Promise<StopTransactionResponse> {
    const measureId = 'StopTransaction with ATG';
    const beginId = PerformanceStatistics.beginMeasure(measureId);
    let transactionId = 0;
    let stopResponse: StopTransactionResponse;
    if (this.chargingStation.getConnector(connectorId)?.transactionStarted) {
      transactionId = this.chargingStation.getConnector(connectorId).transactionId;
      stopResponse = await this.chargingStation.ocppRequestService.sendStopTransaction(transactionId,
        this.chargingStation.getEnergyActiveImportRegisterByTransactionId(transactionId),
        this.chargingStation.getTransactionIdTag(transactionId),
        reason);
    } else {
      logger.warn(`${this.logPrefix(connectorId)} trying to stop a not started transaction${transactionId ? ' ' + transactionId.toString() : ''}`);
    }
    PerformanceStatistics.endMeasure(measureId, beginId);
    return stopResponse;
  }

  private logPrefix(connectorId?: number): string {
    if (connectorId) {
      return Utils.logPrefix(' ' + this.chargingStation.stationInfo.chargingStationId + ' | ATG on connector #' + connectorId.toString() + ':');
    }
    return Utils.logPrefix(' ' + this.chargingStation.stationInfo.chargingStationId + ' | ATG:');
  }
}
