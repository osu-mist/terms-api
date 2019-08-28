const defaultPaginationQuery = { 'page[number]': 1, 'page[size]': 25 };
const fakeCurrentTermCode = '201902';
const fakeTermsTestCases = [
  {
    termCode: '202003',
    description: 'Spring 2020',
    academicYear: '1920',
    financialAidYear: '1920',
    startDate: '2020-03-30',
    endDate: '2020-06-12',
    housingStartDate: '2020-03-29',
    housingEndDate: '2020-06-13',
    registrationStartDate: null,
    registrationEndDate: null,
  },
  {
    termCode: '202002',
    description: 'Winter 2020',
    academicYear: '1920',
    financialAidYear: '1920',
    startDate: '2020-01-06',
    endDate: '2020-03-20',
    housingStartDate: '2020-01-05',
    housingEndDate: '2020-03-21',
    registrationStartDate: '2019-10-18',
    registrationEndDate: '2020-03-13',
  },
  {
    termCode: '202001',
    description: 'Fall 2019',
    academicYear: '1920',
    financialAidYear: '1920',
    startDate: '2019-09-25',
    endDate: '2019-12-13',
    housingStartDate: '2019-09-22',
    housingEndDate: '2019-12-07',
    registrationStartDate: '2019-04-26',
    registrationEndDate: '2019-12-06',
  },
  {
    termCode: '202000',
    description: 'Summer 2019',
    academicYear: '1920',
    financialAidYear: '1920',
    startDate: '2019-06-24',
    endDate: '2019-09-06',
    housingStartDate: '2019-06-23',
    housingEndDate: '2019-09-07',
    registrationStartDate: '2019-03-22',
    registrationEndDate: '2019-09-06',
  },
  {
    termCode: '201903',
    description: 'Spring 2019',
    academicYear: '1819',
    financialAidYear: '1819',
    startDate: '2019-04-01',
    endDate: '2019-06-14',
    housingStartDate: '2019-03-26',
    housingEndDate: '2019-06-08',
    registrationStartDate: '2019-02-01',
    registrationEndDate: '2019-06-07',
  },
  {
    termCode: '201902',
    description: 'Winter 2019',
    academicYear: '1819',
    financialAidYear: '1819',
    startDate: '2019-01-07',
    endDate: '2019-03-22',
    housingStartDate: '2019-01-06',
    housingEndDate: '2019-03-16',
    registrationStartDate: '2018-10-19',
    registrationEndDate: '2019-03-15',
  },
  {
    termCode: '201901',
    description: 'Fall 2018',
    academicYear: '1819',
    financialAidYear: '1819',
    startDate: '2018-09-20',
    endDate: '2018-12-07',
    housingStartDate: '2018-09-23',
    housingEndDate: '2018-12-08',
    registrationStartDate: '2018-04-27',
    registrationEndDate: '2018-11-30',
  },
  {
    termCode: '201900',
    description: 'Summer 2018',
    academicYear: '1819',
    financialAidYear: '1819',
    startDate: '2018-06-25',
    endDate: '2018-09-07',
    housingStartDate: '2018-06-17',
    housingEndDate: '2018-09-08',
    registrationStartDate: '2018-03-24',
    registrationEndDate: '2018-09-07',
  },
];
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
const exactlyMatchQueryTestCases = [
  { academicYear: '1819' },
  { calendarYear: '2019' },
  { financialAidYear: '1819' },
];
const inRangeQueryTestCases = [
  { date: '2019-03-01' },
  { housingDate: '2019-03-01' },
  { registrationDate: '2019-03-01' },
];
const inEnumsQueryTestCases = [
  { status: ['completed'] },
  { status: ['current'] },
  { status: ['current', 'open'] },
  { status: ['open'] },
  { status: ['not-open'] },
];

module.exports = {
  defaultPaginationQuery,
  fakeCurrentTermCode,
  fakeTermsTestCases,
  generateCalendarYearAndSeasonTestCases,
  generateTermStatusTestCases,
  exactlyMatchQueryTestCases,
  inRangeQueryTestCases,
  inEnumsQueryTestCases,
};
