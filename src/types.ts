enum UsState {
  NY,
  NC,
  FL,
  // etc
}

enum InsurancePayer {
  AETNA,
  BCBS,
  CIGNA,
  // etc
}

enum ClinicianType {
  THERAPIST,
  PSYCHOLOGIST,
}

enum AppointmentType {
  ASSESSMENT_SESSION_1,
  ASSESSMENT_SESSION_2,
  THERAPY_INTAKE,
  THERAPY_SIXTY_MINS,
}

enum AppointmentStatus {
  UPCOMING,
  OCCURRED,
  NO_SHOW,
  RE_SCHEDULED,
  CANCELLED,
  LATE_CANCELLATION,
}

export interface IPatient {
  id: string;
  firstName: string;
  lastName: string;
  state: UsState;
  insurance: InsurancePayer;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClinician {
  id: string;
  firstName: string;
  lastName: string;
  states: UsState[];
  insurances: InsurancePayer[];
  clinicianType: ClinicianType;
  appointments: IAppointment[];
  availableSlots: IAvailableSlot[];
  maxDailyAppointments: number;
  maxWeeklyAppointments: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailableSlot {
  id: string;
  clinicianId: string;
  clinician: IClinician;
  date: Date;
  length: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointment {
  id: string;
  patientId: string;
  patient: IPatient;
  clinicianId: string;
  clinician: IClinician;
  scheduledFor: Date;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}
