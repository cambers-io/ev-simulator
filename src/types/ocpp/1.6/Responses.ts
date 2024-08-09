import { EmptyObject } from '../../EmptyObject';
import { OCPPConfigurationKey } from '../Configuration';

export interface HeartbeatResponse {
  currentTime: string;
}

export enum OCPP16UnlockStatus {
  UNLOCKED = 'Unlocked',
  UNLOCK_FAILED = 'UnlockFailed',
  NOT_SUPPORTED = 'NotSupported'
}

export interface UnlockConnectorResponse {
  status: OCPP16UnlockStatus;
}

export enum OCPP16ConfigurationStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  REBOOT_REQUIRED = 'RebootRequired',
  NOT_SUPPORTED = 'NotSupported'
}

export interface ChangeConfigurationResponse {
  status: OCPP16ConfigurationStatus;
}

export enum OCPP16RegistrationStatus {
  ACCEPTED = 'Accepted',
  PENDING = 'Pending',
  REJECTED = 'Rejected'
}

export interface OCPP16BootNotificationResponse {
  status: OCPP16RegistrationStatus;
  currentTime: string;
  interval: number;
}

export type StatusNotificationResponse = EmptyObject;

export interface GetConfigurationResponse {
  configurationKey: OCPPConfigurationKey[];
  unknownKey: string[];
}

export enum OCPP16ChargingProfileStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  NOT_SUPPORTED = 'NotSupported',
}

export interface SetChargingProfileResponse {
  status: OCPP16ChargingProfileStatus;
}

export enum OCPP16AvailabilityStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  SCHEDULED = 'Scheduled'
}

export interface ChangeAvailabilityResponse {
  status: OCPP16AvailabilityStatus;
}

export enum OCPP16ClearChargingProfileStatus {
  ACCEPTED = 'Accepted',
  UNKNOWN = 'Unknown'
}

export interface ClearChargingProfileResponse {
  status: OCPP16ClearChargingProfileStatus;
}

export interface GetDiagnosticsResponse {
  fileName?: string;
}

export type DiagnosticsStatusNotificationResponse = EmptyObject;

export enum OCPP16TriggerMessageStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  NOT_IMPLEMENTED = 'NotImplemented'
}

export interface OCPP16TriggerMessageResponse {
  status: OCPP16TriggerMessageStatus
}


export enum GetCompositeScheduleStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected'
}

export enum DataTransferStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  UNKNOWNMESSAGEID = 'UnknownMessageId',

  UNKNOWNVENDORID ='UnknownVendorId'

}

export interface OCPP16GetCompositeScheduleResponse {
  status: GetCompositeScheduleStatus,
  connectorId?: number,
  scheduleStart?:string,
  chargingSchedule?:OCPP16ChargingSchedule
}

export interface OCPP16DataTransferResponse{
  status: DataTransferStatus
}

export interface OCPP16ChargingSchedule {
  duration?: number,
  startSchedule?: string,
  chargingRateUnit:string,
  chargingSchedulePeriod: OCPP16ChargingSchedulePeriod,
  minChargingRate?: number
}

export interface OCPP16ChargingSchedulePeriod {
  startPeriod: number,
  limit: number,
  numberPhases?: number
}

