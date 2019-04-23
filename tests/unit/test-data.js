const generateCalendarYearAndSeasonTestCases = [
  { testCase: { description: 'Fall 1234' }, season: 'Fall', calendarYear: '1234' },
  { testCase: { description: 'Winter 1234' }, season: 'Winter', calendarYear: '1234' },
  { testCase: { description: 'Spring 1234' }, season: 'Spring', calendarYear: '1234' },
  { testCase: { description: 'Summer 1234' }, season: 'Summer', calendarYear: '1234' },
  { testCase: { description: ' Winter 1234' }, season: null, calendarYear: null },
  { testCase: { description: 'Winter 1234 ' }, season: null, calendarYear: null },
  { testCase: { description: 'Winters 1234' }, season: null, calendarYear: null },
  { testCase: { description: 'Winter 12345' }, season: null, calendarYear: null },
];

module.exports = {
  generateCalendarYearAndSeasonTestCases,
};
