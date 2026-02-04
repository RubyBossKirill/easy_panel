import { format, parseISO, addDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

// Форматирование даты для отображения
export const formatDate = (date: string | Date, formatStr: string = 'dd.MM.yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ru });
};

// Форматирование времени
export const formatTime = (time: string): string => {
  return time;
};

// Форматирование даты и времени
export const formatDateTime = (date: string | Date, time: string): string => {
  const dateStr = formatDate(date);
  return `${dateStr} в ${time}`;
};

// Получение названия дня недели
export const getDayName = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEEE', { locale: ru });
};

// Проверка, является ли дата сегодняшней
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
};

// Проверка, является ли дата завтрашней
export const isTomorrow = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const tomorrow = addDays(new Date(), 1);
  return format(dateObj, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
};

// Получение относительного времени
export const getRelativeTime = (date: string | Date): string => {
  if (isToday(date)) {
    return 'Сегодня';
  }
  if (isTomorrow(date)) {
    return 'Завтра';
  }
  return formatDate(date);
};

// Генерация временных слотов
export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  duration: number = 60
): string[] => {
  const slots: string[] = [];
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);
  
  let current = start;
  while (current < end) {
    slots.push(format(current, 'HH:mm'));
    current = addDays(current, duration / (24 * 60));
  }
  
  return slots;
};

// Проверка доступности временного слота
export const isTimeSlotAvailable = (
  time: string,
  date: string,
  bookedSlots: string[]
): boolean => {
  const slotKey = `${date}_${time}`;
  return !bookedSlots.includes(slotKey);
};

// Получение начала и конца дня
export const getDayBounds = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfDay(dateObj),
    end: endOfDay(dateObj),
  };
}; 