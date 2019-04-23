const appRoot = require('app-root-path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const _ = require('lodash');

const termsSerializer = appRoot.require('api/v1/serializers/terms-serializer');
const testData = appRoot.require('tests/unit/test-data');

chai.should();
chai.use(chaiAsPromised);
const { expect } = chai;

describe('Test terms-serializer', () => {
  it('test generateCalendarYearAndSeason', () => {
    const { generateCalendarYearAndSeason } = termsSerializer;
    const { generateCalendarYearAndSeasonTestCases } = testData;

    _.forEach(generateCalendarYearAndSeasonTestCases, ({ testCase, season, calendarYear }) => {
      generateCalendarYearAndSeason(testCase);
      expect(testCase.season).to.equal(season);
      expect(testCase.calendarYear).to.equal(calendarYear);
    });
  });
});
