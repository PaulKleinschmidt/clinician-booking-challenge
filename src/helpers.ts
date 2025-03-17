import { isAfter, isSameDay, differenceInDays } from 'date-fns';

export const isDateOnLaterDay = (date: Date, dateToCompare: Date): boolean => {
  return isAfter(date, dateToCompare) && !isSameDay(date, dateToCompare);
};

export const isWithinSevenDays = (date: Date, dateToCompare: Date): boolean => {
  const diffInDays = differenceInDays(date, dateToCompare);

  return diffInDays <= 7;
};

export const isEmpty = <T>(arr: T[]): boolean => {
  return arr.length === 0;
};
