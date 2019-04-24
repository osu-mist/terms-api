const appRoot = require('app-root-path');
const chai = require('chai');
const assertArrays = require('chai-arrays');
const chaiDatetime = require('chai-datetime');
const chaiAsPromised = require('chai-as-promised');
const _ = require('lodash');
const moment = require('moment-timezone');
const sinon = require('sinon');

const termsSerializer = appRoot.require('api/v1/serializers/terms-serializer');
const testData = appRoot.require('tests/unit/test-data');

chai.should();
chai.use(assertArrays);
chai.use(chaiAsPromised);
chai.use(chaiDatetime);
const { expect } = chai;

describe('Test terms-serializer', () => {
  const { defaultPaginationQuery, fakeCurrentTermCode } = testData;
  // const termsSchema = {
  //   links: {
  //     self: `${fakeBaseUrl}/${resourceType}`,
  //   },
  //   data: {
  //     id: fakeId,
  //     type: resourceType,
  //     links: { self: null },
  //   },
  // };
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

    _.forEach(generateTermStatusTestCases, ({ testCase, status }) => {
      generateTermStatus(testCase, fakeCurrentTermCode);
      expect(testCase.status).to.be.containingAllOf(status);
    });
  });
  it('test serializeTerms', () => {
    const { serializeTerms } = termsSerializer;
    const {
      fakeTermsTestCases,
      exactlyMatchQueryTestCases,
      inRangeQueryTestCases,
      inEnumsQueryTestCases,
    } = testData;

    const getSerializedData = (testQuery) => {
      const clonedFakeTermsTestCases = _.clone(fakeTermsTestCases);
      const query = { ...defaultPaginationQuery, ...testQuery };

      const { data } = serializeTerms(clonedFakeTermsTestCases, fakeCurrentTermCode, query);
      const field = _.keys(testQuery)[0];
      const expectedValue = _.values(testQuery)[0];

      return {
        actualData: data,
        field,
        expectedValue,
      };
    };

    // test exactlyMatch filters
    _.forEach(exactlyMatchQueryTestCases, (exactlyMatchQuery) => {
      const { actualData, field, expectedValue } = getSerializedData(exactlyMatchQuery);

      _.forEach(actualData, ({ attributes }) => {
        expect(attributes[field]).to.equal(expectedValue);
      });
    });

    // test inRange filters
    _.forEach(inRangeQueryTestCases, (inRangeQuery) => {
      const { actualData, field, expectedValue } = getSerializedData(inRangeQuery);

      _.forEach(actualData, ({ attributes }) => {
        let startDate;
        let endDate;

        switch (field) {
          case 'date':
            startDate = new Date(attributes.startDate);
            endDate = new Date(attributes.endDate);
            break;
          case 'housingDate':
            startDate = new Date(attributes.housingStartDate);
            endDate = new Date(attributes.housingEndDate);
            break;
          case 'registrationDate':
            startDate = new Date(attributes.registrationStartDate);
            endDate = new Date(attributes.registrationEndDate);
            break;
          default:
            throw new Error('Unexpected range filter.');
        }
        expect(new Date(expectedValue)).to.withinDate(startDate, endDate);
      });
    });

    // test inEnums filters
    _.forEach(inEnumsQueryTestCases, (inEnumsQuery) => {
      const { actualData, field, expectedValue } = getSerializedData(inEnumsQuery);

      _.forEach(actualData, ({ attributes }) => {
        expect(attributes[field]).to.be.containingAnyOf(expectedValue);
      });
    });
  });
});
