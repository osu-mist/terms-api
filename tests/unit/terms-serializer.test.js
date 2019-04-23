const appRoot = require('app-root-path');
const chai = require('chai');
const assertArrays = require('chai-arrays');
const chaiAsPromised = require('chai-as-promised');
const _ = require('lodash');
const moment = require('moment-timezone');
const sinon = require('sinon');

const termsSerializer = appRoot.require('api/v1/serializers/terms-serializer');
const testData = appRoot.require('tests/unit/test-data');

chai.should();
chai.use(assertArrays);
chai.use(chaiAsPromised);
const { expect } = chai;

describe('Test terms-serializer', () => {
  let clock;
  before(() => {
    clock = sinon.useFakeTimers(moment.tz('2019-03-01', 'PST8PDT').toDate());
  });
  after(() => {
    clock.restore();
  });

  it('test generateCalendarYearAndSeason', () => {
    const { generateCalendarYearAndSeason } = termsSerializer;
    const { generateCalendarYearAndSeasonTestCases } = testData;

    _.forEach(generateCalendarYearAndSeasonTestCases, ({ testCase, season, calendarYear }) => {
      generateCalendarYearAndSeason(testCase);
      expect(testCase.season).to.equal(season);
      expect(testCase.calendarYear).to.equal(calendarYear);
    });
  });
  it('test generateTermStatus', () => {
    const { generateTermStatus } = termsSerializer;
    const { generateTermStatusTestCases } = testData;
    const currentTermCode = '201902';

    _.forEach(generateTermStatusTestCases, ({ testCase, status }) => {
      generateTermStatus(testCase, currentTermCode);
      expect(testCase.status).to.be.containingAllOf(status);
    });
  });
});
