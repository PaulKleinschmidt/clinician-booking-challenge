import { generateAssessmentSlotsForPatient } from '../src';
import { patient, availableSlots, clinicians } from '../src/mock-db';
import { InsurancePayer, IPatient, UsState } from '../src/types';

const fixedDate = new Date('2025-03-17T12:00:00.000Z');

describe(generateAssessmentSlotsForPatient, () => {
  it('should return null if no relevant clinicians are found for the patient', () => {
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
    ).toEqual(null);
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
          new Date('2025-03-19T12:00:00.000Z'),
          new Date('2025-03-20T12:00:00.000Z'),
        ],
      ],
    });
  });
});
