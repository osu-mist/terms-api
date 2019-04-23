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
const generateTermStatusTestCases = [
  {
    testCase: {
      termCode: '201902', registrationStartDate: '2019-01-01', registrationEndDate: '2019-04-01',
    },
    status: ['current', 'open'],
  },
  {
    testCase: {
      termCode: '201902', registrationStartDate: '2019-01-07', registrationEndDate: '2019-03-22',
    },
    status: ['open'],
  },
  {
    testCase: {
      termCode: '201901', registrationStartDate: '2019-01-01', registrationEndDate: '2019-02-01',
    },
    status: ['completed'],
  },
  {
    testCase: {
      termCode: '201903', registrationStartDate: '2019-04-01', registrationEndDate: '2019-05-01',
    },
    status: ['not-open'],
  },
];

module.exports = {
  generateCalendarYearAndSeasonTestCases,
  generateTermStatusTestCases,
};
