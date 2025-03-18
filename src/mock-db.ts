/**
 * This file contains some mock data that can be used for testing.
 *
 * In a real application, we would read this data from a DB.
 */

import {
  ClinicianType,
  IAppointment,
  IAvailableSlot,
  IClinician,
  InsurancePayer,
  IPatient,
  UsState,
} from './types';

export const patient: IPatient = {
  id: '251ef27a-2ca7-4517-ab4a-93208287224c',
  firstName: 'Paul',
  lastName: 'Kleinschmidt',
  state: UsState.NY,
  insurance: InsurancePayer.AETNA,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const clinician1: IClinician = {
  id: '9c516382-c5b2-4677-a7ac-4e100fa35bdd',
  firstName: 'Jane',
  lastName: 'Doe',
  states: [UsState.NY, UsState.FL],
  insurances: [InsurancePayer.AETNA, InsurancePayer.CIGNA],
  clinicianType: ClinicianType.PSYCHOLOGIST,
  appointments: [],
  maxDailyAppointments: 2,
  maxWeeklyAppointments: 8,
  availableSlots: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const clinician2: IClinician = {
  id: '4982c223-643d-439f-80c5-72aecabe8fb8',
  firstName: 'Gregory',
  lastName: 'House',
  states: [UsState.NC, UsState.NY],
  insurances: [InsurancePayer.BCBS, InsurancePayer.AETNA],
  clinicianType: ClinicianType.PSYCHOLOGIST,
  appointments: [
    // Week of 3/16: three appointments (fully booked for the week)
    { scheduledFor: new Date('2025-03-18T12:00:00.000Z') },
    { scheduledFor: new Date('2025-03-19T12:00:00.000Z') },
    { scheduledFor: new Date('2025-03-20T12:00:00.000Z') },
    // Week of 3/24: two appointments on same day, one remaining appointment slot available for the week
    { scheduledFor: new Date('2025-03-25T12:00:00.000Z') },
    { scheduledFor: new Date('2025-03-25T15:00:00.000Z') },
  ] as unknown as IAppointment[],
  maxDailyAppointments: 2,
  maxWeeklyAppointments: 3,
  availableSlots: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const clinicians: IClinician[] = [clinician1, clinician2];

export const availableSlots: IAvailableSlot[] = [
  // Slots for clinician 1
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician1.id,
    clinician: clinician1,
    date: new Date('2025-03-18T12:00:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3f3426ab-a4fd-4b3d-8c2d-67bbad6fd019',
    clinicianId: clinician1.id,
    clinician: clinician1,
    date: new Date('2025-03-19T08:00:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician1.id,
    clinician: clinician1,
    date: new Date('2025-03-19T12:00:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Conflicting appointment (should be filtered out by optimizeAssessmentSlots)
  {
    id: '4982123c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician1.id,
    clinician: clinician1,
    date: new Date('2025-03-19T12:30:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician1.id,
    clinician: clinician1,
    date: new Date('2025-03-20T12:00:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician1.id,
    clinician: clinician1,
    date: new Date('2025-03-27T12:00:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Slots for clinician 2
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician2.id,
    clinician: clinician2,
    date: new Date('2025-03-19T12:00:00.000Z'), // <-- Clinician is already fully booked the week of 3/16, this slot should be filtered out
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician2.id,
    clinician: clinician2,
    date: new Date('2025-03-20T12:00:00.000Z'), // <-- Clinician is already fully booked the week of 3/16, this slot should be filtered out
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician2.id,
    clinician: clinician2,
    date: new Date('2025-03-27T12:00:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician2.id,
    clinician: clinician2,
    date: new Date('2025-03-28T12:00:00.000Z'), // <-- Clinician only has one available slot for the week. The slot on 3/27 is the only bookable option. This slot should be filtered out.
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4982c223-643d-439f-80c5-72aecabe8fb8',
    clinicianId: clinician2.id,
    clinician: clinician2,
    date: new Date('2025-04-01T12:00:00.000Z'),
    length: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
