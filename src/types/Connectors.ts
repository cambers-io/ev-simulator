import { MeterValue, SampledValue } from './ocpp/MeterValues';

import { AvailabilityType } from './ocpp/Requests';
import { ChargePointStatus } from './ocpp/ChargePointStatus';
import { ChargingProfile } from './ocpp/ChargingProfile';
import {OCPP16ChargePointErrorCode} from "./ocpp/1.6/ChargePointErrorCode";

export interface SampledValueTemplate extends SampledValue {
  fluctuationPercent?: number;
}

export interface Connector {
  availability: AvailabilityType;
  bootStatus?: ChargePointStatus;
  status?: ChargePointStatus;
  errorCode?: OCPP16ChargePointErrorCode ;
  MeterValues: SampledValueTemplate[];
  authorizeIdTag?: string;
  VIN?: string;
  authorized?: boolean;
  pluggedIn?: boolean;
  transactionStarted?: boolean;
  transactionId?: number;
  batterySize?: number;
  startEnergy?:number;
  currentEnergy?:number;
  desiredEnergy?:number;
  transactionSetInterval?: NodeJS.Timeout;
  transactionIdTag?: string;
  energyActiveImportRegisterValue?: number; // In Wh
  transactionEnergyActiveImportRegisterValue?: number; // In Wh
  transactionBeginMeterValue?: MeterValue;
  chargingProfiles?: ChargingProfile[];
}

export type Connectors = Record<string, Connector>;
