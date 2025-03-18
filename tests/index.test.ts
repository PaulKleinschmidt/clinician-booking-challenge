import {
  filterSlotsByAvailability,
  generateAssessmentSlotsForPatient,
  optimizeAssessmentSlots,
} from '../src';
import { ASSESSMENT_DURATION_MINUTES } from '../src/constants';
import {
  patient,
  availableSlots,
  clinicians,
  clinician2,
} from '../src/mock-db';
import { InsurancePayer, IPatient, UsState } from '../src/types';

const fixedDate = new Date('2025-03-17T12:00:00.000Z');

describe(generateAssessmentSlotsForPatient, () => {
  it('should return an empty object if no relevant clinicians are found for the patient', () => {
    const patientWithOtherInsurance: IPatient = {
      id: '251ef27a-2ca7-4517-ab4a-93208287224c',
      firstName: 'Paul',
      lastName: 'Kleinschmidt',
      state: UsState.NY,
      insurance: InsurancePayer.UHC,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(
      generateAssessmentSlotsForPatient(
        patientWithOtherInsurance,
        clinicians,
        availableSlots,
        fixedDate
      )
    ).toEqual({});
  });

  it('should return the available assessment slots for the patient', () => {
    expect(
      generateAssessmentSlotsForPatient(
        patient,
        clinicians,
        availableSlots,
        fixedDate
      )
    ).toEqual({
      '9c516382-c5b2-4677-a7ac-4e100fa35bdd': [
        [
          new Date('2025-03-18T12:00:00.000Z'),
          new Date('2025-03-19T08:00:00.000Z'),
        ],
        [
          new Date('2025-03-18T12:00:00.000Z'),
          new Date('2025-03-19T12:00:00.000Z'),
        ],
        [
          new Date('2025-03-18T12:00:00.000Z'),
          new Date('2025-03-20T12:00:00.000Z'),
        ],
        [
          new Date('2025-03-19T08:00:00.000Z'),
          new Date('2025-03-20T12:00:00.000Z'),
        ],
        [
          new Date('2025-03-19T12:00:00.000Z'),
          new Date('2025-03-20T12:00:00.000Z'),
        ],
        [
          new Date('2025-03-20T12:00:00.000Z'),
          new Date('2025-03-27T12:00:00.000Z'),
        ],
      ],
      '4982c223-643d-439f-80c5-72aecabe8fb8': [
        [
          new Date('2025-03-27T12:00:00.000Z'),
          new Date('2025-04-01T12:00:00.000Z'),
        ],
      ],
    });
  });
});

describe(optimizeAssessmentSlots, () => {
  it('should return an optimized list of assessment slots', () => {
    expect(
      optimizeAssessmentSlots(
        [
          new Date('2024-08-19T12:00:00.000Z'),
          new Date('2024-08-19T12:15:00.000Z'),
          new Date('2024-08-19T12:30:00.000Z'),
          new Date('2024-08-19T12:45:00.000Z'),
          new Date('2024-08-19T13:00:00.000Z'),
          new Date('2024-08-19T13:15:00.000Z'),
          new Date('2024-08-19T13:30:00.000Z'),
        ],
        ASSESSMENT_DURATION_MINUTES
      )
    ).toEqual([
      new Date('2024-08-19T12:00:00.000Z'),
      new Date('2024-08-19T13:30:00.000Z'),
    ]);
  });
});

describe(filterSlotsByAvailability, () => {
  it('should return slots that are bookable with the clinician, taking into account their existing appointments and appointment limits', () => {
    expect(
      filterSlotsByAvailability(
        [
          // Appointments in the week of 3/16 (should be filtered out given this clinician's appointment load)
          new Date('2025-03-18T14:00:00.000Z'),
          new Date('2025-03-20T14:00:00.000Z'),
          new Date('2025-03-21T14:00:00.000Z'),
          // Appointments in the week of 3/23
          new Date('2025-03-25T09:00:00.000Z'), // <-- Should be filtered out. his clinician has 2 appointments on 3/25 already
          new Date('2025-03-26T12:00:00.000Z'), // <-- This one should be kept
        ],
        clinician2
      )
    ).toEqual([new Date('2025-03-26T12:00:00.000Z')]);
  });
});
