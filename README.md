# recurring-google-events
A function for getting events from Google calendars and formatting them for react-big-calendar.

## About
This gets events from one or many Google calendars. It returns single events and reoccurring events. It currently returns the following types of recoccurring events:

  * weekly events (e.g. every Monday)
  * monthly events by date (e.g. [first of the month](https://www.youtube.com/watch?v=PArF9k2SbQk))
  * monthy events by day (e.g. first Friday).

The function takes two arguments `getAllCalendars(weeklyRecurrence, monthlyRecurrence)` where you can specify how many itterations of the weekly and monthly events it returns.

## Contributing
This is a work in progress. There are probably edge cases and types of reoccurring events it doesn't handle yet. Raise an issue to add a feature or make a correction

## License
MIT
