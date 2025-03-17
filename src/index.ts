import {
  ClinicianType,
  IAvailableSlot,
  IClinician,
  InsurancePayer,
  IPatient,
  UsState,
} from './types';
import { isDateOnLaterDay, isEmpty, isWithinSevenDays } from './helpers';
import { groupBy } from 'lodash';

/*
 * Finds the clinicians in our mock DB that match the provided insurance and state
 *
 * Note: This function takes a list of clinicians from the mock db as an argument. In a real app, we would query our DB here
 */
const findCliniciansByInsuranceAndState = (
  insurance: InsurancePayer,
  state: UsState,
  clinicians: IClinician[]
): IClinician[] => {
  return clinicians.filter(
    (clinician) =>
      // Ensure we are only getting psychologists, since they handle assessments
      clinician.clinicianType === ClinicianType.PSYCHOLOGIST &&
      clinician.insurances.includes(insurance) &&
      clinician.states.includes(state)
  );
};

/*
 * Finds the appointment slots in our mock DB that are for the provided clinician ID, sorted by date (most recent first)
 *
 * Note: This function takes a list of available slots from the mock db as an argument. In a real app, we would query our DB here
 */
const findAppointmentSlotsByClinicianIDs = (
  currentDate: Date,
  clinicianIds: string[],
  availableSlots: IAvailableSlot[]
): IAvailableSlot[] => {
  return availableSlots
    .filter(
      (slot) =>
        clinicianIds.includes(slot.clinicianId) &&
        // Assumption: Our slots DB might contain slots in the past. We don't want to show patients slots for times that have already happened, so we'll filter them out
        slot.date > currentDate
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

/*
 * Given an assessment slot, finds all possible associated assessment slots based on the following requirements:
 *
 * - The associated slot must be on a different day
 * - The associated slot must be no more than 7 days apart from the initial slot
 */
const findAssociatedAssessmentSlots = (
  slot: IAvailableSlot,
  slotsForClinician: IAvailableSlot[]
): IAvailableSlot[] => {
  return slotsForClinician.filter(
    (potentialSlot) =>
      isDateOnLaterDay(potentialSlot.date, slot.date) &&
      isWithinSevenDays(potentialSlot.date, slot.date)
  );
};

const generateAssessmentPairsForClinician = (
  slotsForClinician: IAvailableSlot[]
): Date[][] => {
  // If there are no slots for the provided clinician, return early
  if (isEmpty(slotsForClinician)) {
    return [];
  }

  const appointmentSlotTuples: Date[][] = [];

  for (const slot1 of slotsForClinician) {
    // For each slot, find all associated slots
    const availableAssessmentSlots = findAssociatedAssessmentSlots(
      slot1,
      slotsForClinician
    );

    appointmentSlotTuples.push(
      ...availableAssessmentSlots.map((slot2) => [slot1.date, slot2.date])
    );
  }

  return appointmentSlotTuples;
};

export const generateAssessmentSlotsForPatient = (
  patient: IPatient,
  clinicians: IClinician[],
  availableSlots: IAvailableSlot[],
  currentDate: Date
): { [key: string]: Date[][] } | null => {
  const { insurance, state } = patient;

  const cliniciansForPatient = findCliniciansByInsuranceAndState(
    insurance,
    state,
    clinicians
  );

  // If we don't have any clinicians that accept the patients insurance or work in their state, return early
  if (isEmpty(cliniciansForPatient)) {
    return null;
  }

  const slotsForClinicians = findAppointmentSlotsByClinicianIDs(
    currentDate,
    cliniciansForPatient.map((clinician) => clinician.id),
    availableSlots
  );

  // If we have no available slots for the clinicians, return early
  if (isEmpty(slotsForClinicians)) {
    return null;
  }

  // Group the available slots by clinician ID, for performant lookup later
  const slotsByClinicianID = groupBy(
    slotsForClinicians,
    (slot) => slot.clinicianId
  );

  const results: { [key: string]: Date[][] } = {};

  for (const clinician of cliniciansForPatient) {
    const availableSlotsForClinician = slotsByClinicianID[clinician.id];

    const assessmentPairsForClinician = generateAssessmentPairsForClinician(
      availableSlotsForClinician
    );

    if (!isEmpty(assessmentPairsForClinician)) {
      results[clinician.id] = assessmentPairsForClinician;
    }
  }

  return results;
};
