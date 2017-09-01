import axios from 'axios'
import * as Promise from 'bluebird'
import moment from 'moment'

const API_KEY = '' // Google calendar API key
const calendars = [
  {
    name: 'example',
    url: 'example@gmail.com'
  },
]

/*
 * events that occure the same day of every week
 * (i.e. every Monday)
*/
const handleWeekly = (calendar, recurrence, e) => {
  const start = moment(e.start.dateTime)
  const end = moment(e.end.dateTime)
  let reoccurringEvents = []
  let add = 1

  while (recurrence > 0) {
    const reoccurringEvent = {
      eventType: calendar.name,
      creator: e.creator,
      end: end.clone().add(add, 'week')._d,
      gLink: e.htmlLink,
      description: e.description,
      location: e.location,
      start: start.clone().add(add, 'week')._d,
      title: e.summary,
      meta: e
    }
    reoccurringEvents.push(reoccurringEvent)
    recurrence --
    add ++
  }
  return reoccurringEvents
}

/*
 * events that occur the same date of every month
 * (i.e. the 1st, the 8th)
*/
const handleDateOfMonth = (calendar, recurrence, e) => {
  const start = moment(e.start.dateTime)
  const end = moment(e.end.dateTime)
  let reoccurringEvents = []
  let add = 1

  while (recurrence > 0) {
    const reoccurringEvent = {
      eventType: calendar.name,
      creator: e.creator,
      end: end.clone().add(add, 'months')._d,
      gLink: e.htmlLink,
      description: e.description,
      location: e.location,
      start: start.clone().add(add, 'months')._d,
      title: e.summary,
      meta: e
    }
    reoccurringEvents.push(reoccurringEvent)
    recurrence --
    add ++
  }
  return reoccurringEvents
}

/*
 * events that occur the same day of the month
 * (i.e. first Friday, last Monday)
 */
const handleDayOfMonth = (calendar, recurrence, e) => {
  const start = moment(e.start.dateTime)
  const end = moment(e.end.dateTime)
  const day = start.day()
  const date = start.date()
  let counter
  if (date <= 7) {
    counter = 1
  } else if ((date >7) && (date <= 14)) {
    counter = 7
  } else if ((date > 14) && (date <= 21)) {
    counter = 14
  } else if ((date > 21) && (date <= 28)) {
    counter = 21
  } else {
    counter = 28
  }

  let reoccurringEvents = []

  while (recurrence > 0) {
    let tempCounter = counter
    // doesn't work with Moment
    let nextStart = new Date(start.year(), start.month() + recurrence,
                              tempCounter, start.hour(), start.minutes())
    let nextEnd = new Date(end.year(), end.month() + recurrence,
                            tempCounter, end.hour(), end.minutes())

    while (tempCounter < 31) {
      let isEqual = nextStart.getDay() == start.day()

      if (isEqual) {
        const reoccurringEvent = {
          eventType: calendar.name,
          creator: e.creator,
          end: nextEnd,
          gLink: e.htmlLink,
          description: e.description,
          location: e.location,
          start: nextStart,
          title: e.summary,
          meta: e
        }
        reoccurringEvents.push(reoccurringEvent)
        tempCounter = counter
        break
      }
      nextStart = new Date(start.year(), start.month() + recurrence,
        tempCounter, start.hour(), start.minutes())
      nextEnd = new Date(end.year(), end.month() + recurrence,
        tempCounter, end.hour(), end.minutes())
        
      tempCounter ++
    }
    recurrence --
  }
  return reoccurringEvents
}

export default {

  getAllCalendars: (weeklyRecurrence, monthlyRecurrence) => Promise.map(calendars, (calendar) => {
    const url = `https://content.googleapis.com/calendar/v3/calendars/${calendar.url}/events?key=${API_KEY}`
    return axios.get(url)
      .then(res => {
        const items = res.data.items.filter(item => item.status != "cancelled")
        const oneTime = items.filter(item => !item.recurrence).map(e => {
          return {
            title: e.summary,
            eventType: calendar.name,
            start: new Date(e.start.dateTime).toString(),
            end: new Date(e.end.dateTime).toString(),
            description: e.description,
            location: e.location,
            glink: e.htmlLink,
            meta: e
          }
        })
        const reoccurring = items.filter(item => item.recurrence)
          .map(event => {
            const r = event.recurrence[0].split(';')
            return { e: event, r }
          })

        const weekly = reoccurring.filter(item => item.r[0] == "RRULE:FREQ=WEEKLY")
          .map(item => item.e)
        const reoccurringWeekly = [].concat.apply([], weekly
          .map(e => handleWeekly(calendar, weeklyRecurrence, e)))

        const monthly = reoccurring.filter(item => item.r[0] == "RRULE:FREQ=MONTHLY")
        const dateOfMonth = monthly.filter(item => item.r[item.r.length - 1].includes("TH") )
          .map(item => item.e)
        const dayOfMonth = monthly.filter(item => !item.r[item.r.length - 1 ].includes("TH") )
          .map(item => item.e)

        const reoccurringDateOfMonth = [].concat.apply([], dateOfMonth
          .map(e => handleDateOfMonth(calendar, monthlyRecurrence, e)))
        const reoccurringDayOfMonth = [].concat.apply([], dayOfMonth
          .map(e => handleDayOfMonth(calendar, monthlyRecurrence, e)))

        const allEvents = [].concat(
          oneTime,
          reoccurringWeekly,
          reoccurringDateOfMonth,
          reoccurringDayOfMonth
        )
        return allEvents
      })
  }).then(allEvents => [].concat.apply([], allEvents))

}
