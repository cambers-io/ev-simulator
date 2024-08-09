import ChargingStationConfiguration from './ChargingStationConfiguration';
import { Connectors } from './Connectors';
import { OCPPProtocol } from './ocpp/OCPPProtocol';
import { OCPPVersion } from './ocpp/OCPPVersion';

export enum CurrentType {
  AC = 'AC',
  DC = 'DC',
}

export enum PowerUnits {
  WATT = 'W',
  KILO_WATT = 'kW',
}
export enum ChargingRateUnitType {
  W = 'W',
  A = 'A'
}

export enum Voltage {
  VOLTAGE_110 = 110,
  VOLTAGE_230 = 230,
  VOLTAGE_400 = 400,
  VOLTAGE_800 = 800
}

export interface AutomaticTransactionGenerator {
  enable: boolean;
  batterySize: number,
  minBatterySize: number,
  maxBatterySize: number,
  minStartEnergy: number,
  maxStartEnergy: number,
  minCurrentEnergy: number,
  maxCurrentEnergy: number,
  minDesiredEnergy: number,
  maxDesiredEnergy: number,
  minDuration: number;
  maxDuration: number;
  minDelayBetweenTwoTransactions: number;
  maxDelayBetweenTwoTransactions: number;
  probabilityOfStart: number;
  stopAfterHours: number;
  stopAfterNumberOfTransaction: number;
  stopOnConnectionFailure: boolean;
  VIN: string;
  requireAuthorize?: boolean
}

export default interface ChargingStationTemplate {
  supervisionURL?: string;
  supervisionUser?: string;
  supervisionPassword?: string;
  ocppVersion?: OCPPVersion;
  ocppProtocol?: OCPPProtocol;
  authorizationFile?: string;
  baseName: string;
  nameSuffix?: string;
  fixedName?: boolean;
  chargePointModel: string;
  chargePointVendor: string;
  chargeBoxSerialNumberPrefix?: string;
  firmwareVersion?: string;
  power: number | number[];
  powerSharedByConnectors?: boolean;
  powerUnit: PowerUnits;
  currentOutType?: CurrentType;
  voltageOut?: Voltage;
  numberOfPhases?: number;
  numberOfConnectors?: number | number[];
  useConnectorId0?: boolean;
  randomConnectors?: boolean;
  resetTime?: number;
  autoRegister: boolean;
  autoReconnectMaxRetries?: number;
  reconnectExponentialDelay?: boolean;
  registrationMaxRetries?: number;
  enableStatistics?: boolean;
  mayAuthorizeAtRemoteStart: boolean;
  beginEndMeterValues?: boolean;
  outOfOrderEndMeterValues?: boolean;
  meteringPerTransaction?: boolean;
  transactionDataMeterValues?: boolean;
  mainVoltageMeterValues?: boolean;
  phaseLineToLineVoltageMeterValues?: boolean;
  Configuration?: ChargingStationConfiguration;
  AutomaticTransactionGenerator: AutomaticTransactionGenerator;
  Connectors: Connectors;
}
