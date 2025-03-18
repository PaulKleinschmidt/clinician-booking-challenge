import {
  ClinicianType,
  IAvailableSlot,
  IClinician,
  InsurancePayer,
  IPatient,
  UsState,
} from './types';
import { isDateOnLaterDay, isEmpty, isWithinSevenDays } from './helpers';
import { flow, groupBy } from 'lodash';
import { addMinutes, startOfDay, startOfWeek } from 'date-fns';
import { ASSESSMENT_DURATION_MINUTES } from './constants';

/*
 * Filters a list of slots, returning only those that are bookable with
 * the clinician given their existing appointments and appointment limits
 *
 * A slot is considered bookable if:
 * - The clinician has not exceeded their daily appointment limit (maxDailyAppointments)
 * - The clinician has not exceeded their weekly appointment limit (maxWeeklyAppointments)
 */
export const filterSlotsByAvailability = (
  slots: Date[],
  clinician: IClinician
): Date[] => {
  const { maxDailyAppointments, maxWeeklyAppointments, appointments } =
    clinician;
  const dailyAppointmentCountMap = new Map();
  const weeklyAppointmentCountMap = new Map();

  for (const appointment of appointments) {
    const dayKey = startOfDay(appointment.scheduledFor).toISOString();
    // Assumption: a clinician's workweek begins on Sunday and ends on Saturday
    const weekKey = startOfWeek(appointment.scheduledFor).toISOString();

    dailyAppointmentCountMap.set(
      dayKey,
      (dailyAppointmentCountMap.get(dayKey) ?? 0) + 1
    );
    weeklyAppointmentCountMap.set(
      weekKey,
      (weeklyAppointmentCountMap.get(weekKey) ?? 0) + 1
    );
  }

  return slots.filter((slot) => {
    const dayKey = startOfDay(slot).toISOString();
    const weekKey = startOfWeek(slot).toISOString();

    const numAppointmentsOnSameDay = dailyAppointmentCountMap.get(dayKey) ?? 0;
    const numAppointmentsOnSameWeek =
      weeklyAppointmentCountMap.get(weekKey) ?? 0;

    const isBookable =
      numAppointmentsOnSameDay < maxDailyAppointments &&
      numAppointmentsOnSameWeek < maxWeeklyAppointments;

    /*
     * If the slot is bookable, simulate booking it by incrementing the daily and weekly appointment counts in the map.
     * This is necessary because we are booking pairs of appointments. Without this check, we would risk exceeding the clinician's
     * daily or weekly limits when booking the second appointment.
     */
    if (isBookable) {
      dailyAppointmentCountMap.set(
        dayKey,
        (dailyAppointmentCountMap.get(dayKey) ?? 0) + 1
      );
      weeklyAppointmentCountMap.set(
        weekKey,
        (weeklyAppointmentCountMap.get(weekKey) ?? 0) + 1
      );
    }

    return isBookable;
  });
};

/*
 * Given a list of assessment slots and a duration, returns an optimized list of bookable slots that reduce
 * the number of overlapping appointments.
 *
 * This function assumes the slots array is sorted in ascending order
 */
export const optimizeAssessmentSlots = (
  slots: Date[],
  duration: number
): Date[] => {
  const result: Date[] = [];

  let lastEndTime: Date | null = null;

  for (const slot of slots) {
    const endTime = addMinutes(slot, duration);

    // If this slot does not overlap with the last chosen end time, push it to the result array
    if (!lastEndTime || slot >= lastEndTime) {
      result.push(slot);
      // Update the last appointment end time
      lastEndTime = endTime;
    }
  }

  return result;
};

/*
 * Finds the clinicians that match the provided insurance and state
 *
 * Note: This function takes a list of clinicians from the mock db as an argument. In a real app, we would query our DB here.
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
 * Finds the appointment slots that are for the provided clinician ID, sorted by date ASC
 *
 * Note: This function takes a list of available slots from the mock db as an argument. In a real app, we would query our DB here.
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
        // Assumption: Our slots DB might contain slots in the past. We don't want to show patients slots for times that have already happened, so we'll filter them out.
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

/*
 * Returns the available assessment slots for a given patient, grouped by clinician ID
 *
 * Example Output:
 * {
 *   "clinician-uuid-1": [
 *     ["2025-03-18T12:00:00.000Z", "2025-03-19T08:00:00.000Z"],
 *     ["2025-03-20T12:00:00.000Z", "2025-03-27T12:00:00.000Z"]
 *   ],
 *   "clinician-uuid-2": [
 *     ["2025-03-18T12:00:00.000Z", "2025-03-19T08:00:00.000Z"]
 *   ]
 * }
 */
export const generateAssessmentSlotsForPatient = (
  patient: IPatient,
  clinicians: IClinician[],
  availableSlots: IAvailableSlot[],
  currentDate: Date
): { [key: string]: Date[][] } => {
  const { insurance, state } = patient;

  const cliniciansForPatient = findCliniciansByInsuranceAndState(
    insurance,
    state,
    clinicians
  );

  // If we don't have any clinicians that accept the patients insurance or work in their state, return early
  if (isEmpty(cliniciansForPatient)) {
    return {};
  }

  const slotsForClinicians = findAppointmentSlotsByClinicianIDs(
    currentDate,
    cliniciansForPatient.map((clinician) => clinician.id),
    availableSlots
  );

  // If we have no available slots for the clinicians, return early
  if (isEmpty(slotsForClinicians)) {
    return {};
  }

  // Group the available slots by clinician ID, for performant lookup later
  const slotsByClinicianID = groupBy(
    slotsForClinicians,
    (slot) => slot.clinicianId
  );

  const results: { [key: string]: Date[][] } = {};

  for (const clinician of cliniciansForPatient) {
    let availableSlotsForClinician = slotsByClinicianID[clinician.id];

    if (!availableSlotsForClinician) continue;

    const slotDates = availableSlotsForClinician.map((slot) => slot.date);
    const processedSlots = flow(
      (filteredSlots: Date[]) =>
        optimizeAssessmentSlots(filteredSlots, ASSESSMENT_DURATION_MINUTES),
      (slots: Date[]) => filterSlotsByAvailability(slots, clinician)
    )(slotDates);

    availableSlotsForClinician = availableSlotsForClinician.filter((slot) =>
      processedSlots.includes(slot.date)
    );

    const assessmentPairsForClinician = generateAssessmentPairsForClinician(
      availableSlotsForClinician
    );

    if (!isEmpty(assessmentPairsForClinician)) {
      results[clinician.id] = assessmentPairsForClinician;
    }
  }

  return results;
};
