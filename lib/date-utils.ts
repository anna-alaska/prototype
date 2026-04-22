import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isToday,
  isWeekend,
  isSameMonth,
  getWeek
} from 'date-fns'
import type { ViewScale } from './types'

// Format date for display
export const formatDate = (dateStr: string, formatStr: string = 'MMM d, yyyy') => {
  return format(parseISO(dateStr), formatStr)
}

// Format date for input
export const formatDateForInput = (dateStr: string) => {
  return dateStr.split('T')[0]
}

// Get today's date string
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

// Calculate position on Gantt
export const calculateBarPosition = (
  startDate: string,
  endDate: string,
  viewStartDate: Date,
  cellWidth: number,
  scale: ViewScale
) => {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  
  let startOffset: number
  let width: number
  
  if (scale === 'day') {
    startOffset = differenceInDays(start, viewStartDate) * cellWidth
    width = (differenceInDays(end, start) + 1) * cellWidth
  } else if (scale === 'week') {
    startOffset = differenceInDays(start, viewStartDate) * (cellWidth / 7)
    width = (differenceInDays(end, start) + 1) * (cellWidth / 7)
  } else {
    // Month view - approximate
    startOffset = differenceInDays(start, viewStartDate) * (cellWidth / 30)
    width = (differenceInDays(end, start) + 1) * (cellWidth / 30)
  }
  
  return { left: Math.max(0, startOffset), width: Math.max(cellWidth / 7, width) }
}

// Get timeline columns based on scale
export const getTimelineColumns = (
  startDate: Date,
  endDate: Date,
  scale: ViewScale
): { date: Date; label: string; subLabel?: string; isToday: boolean; isWeekend: boolean }[] => {
  if (scale === 'day') {
    return eachDayOfInterval({ start: startDate, end: endDate }).map((date) => ({
      date,
      label: format(date, 'd'),
      subLabel: format(date, 'EEE'),
      isToday: isToday(date),
      isWeekend: isWeekend(date)
    }))
  } else if (scale === 'week') {
    return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 }).map((date) => ({
      date,
      label: `W${getWeek(date)}`,
      subLabel: format(date, 'MMM d'),
      isToday: false,
      isWeekend: false
    }))
  } else {
    return eachMonthOfInterval({ start: startDate, end: endDate }).map((date) => ({
      date,
      label: format(date, 'MMM'),
      subLabel: format(date, 'yyyy'),
      isToday: false,
      isWeekend: false
    }))
  }
}

// Get view range based on data
export const getViewRange = (
  businessTasks: { startDate: string; endDate: string }[],
  sprints: { startDate: string; endDate: string }[],
  milestones: { date: string }[],
  scale: ViewScale,
  padding: number = 7
): { start: Date; end: Date } => {
  const allDates = [
    ...businessTasks.flatMap((bt) => [bt.startDate, bt.endDate]),
    ...sprints.flatMap((s) => [s.startDate, s.endDate]),
    ...milestones.map((m) => m.date),
  ].filter(Boolean)
  
  if (allDates.length === 0) {
    const today = new Date()
    return {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: addDays(today, 30)
    }
  }
  
  const dates = allDates.map((d) => parseISO(d))
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
  
  return {
    start: addDays(startOfWeek(minDate, { weekStartsOn: 1 }), -padding),
    end: addDays(endOfWeek(maxDate, { weekStartsOn: 1 }), padding)
  }
}

// Get cell width based on scale
export const getCellWidth = (scale: ViewScale): number => {
  switch (scale) {
    case 'day':
      return 40
    case 'week':
      return 120
    case 'month':
      return 150
  }
}

// Check if date is within range
export const isDateInRange = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  const date = parseISO(dateStr)
  return date >= startDate && date <= endDate
}
