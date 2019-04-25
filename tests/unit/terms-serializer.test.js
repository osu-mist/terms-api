const appRoot = require('app-root-path');
const chai = require('chai');
const assertArrays = require('chai-arrays');
const chaiAsPromised = require('chai-as-promised');
const chaiDatetime = require('chai-datetime');
const _ = require('lodash');
const moment = require('moment-timezone');
const sinon = require('sinon');

const termsSerializer = appRoot.require('api/v1/serializers/terms-serializer');
const testData = appRoot.require('tests/unit/test-data');
const { openapi } = appRoot.require('utils/load-openapi');

chai.should();
chai.use(assertArrays);
chai.use(chaiAsPromised);
chai.use(chaiDatetime);
const { expect } = chai;

describe('Test terms-serializer', () => {
  const { defaultPaginationQuery, fakeCurrentTermCode } = testData;
  let clock;

  /**
   * @summary Helper function to get definition from openapi specification
   * @function
   * @param {string} definition the name of definition
   * @param {Object} nestedOption nested option
   * @param {boolean} nestedOption.dataItem a boolean which represents whether it's a data item
   * @param {string} nestedOption.dataField data field name
   * @returns {Object}
   */
  const getDefinitionProps = (definition, nestedOption) => {
    let result = openapi.definitions[definition].properties;
    if (nestedOption) {
      const { dataItem, dataField } = nestedOption;
      if (dataItem) {
        result = result.data.items.properties.attributes.properties;
      } else if (dataField) {
        result = result.data.properties.attributes.properties[dataField].items.properties;
      }
    }
    return result;
  };

  /**
   * @summary Helper function to check the schema of term resource
   * @function
   * @param {Object} resource
   */
  const checkTermSchema = (resource) => {
    const {
      type,
      links,
      id,
      attributes,
    } = resource;
    const termProps = getDefinitionProps('TermResource');
    expect(resource).to.contain.keys(_.keys(termProps));
    expect(type).to.equal('term');
    expect(links).to.contain.keys(_.keys(getDefinitionProps('SelfLink')));
    expect(id).to.match(new RegExp(termProps.id.pattern));
    expect(attributes).to.contain.keys(_.keys(termProps.attributes.properties));
  };

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

    /**
     * @summary Helper function to call serializeTerms with test queries
     * @function
     * @param {Object} testQuery
     * @returns {Object} serializedData - object of serialized data and test case
     * @returns {Object} serializedData.data - object of actual serialized data
     * @returns {string} serializedData.field - the name of field to be compared
     * @returns {*} serializedData.expectedValue - the expected value of the field
     */
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

    // check resource schema
    const clonedFakeTermsTestCases = _.clone(fakeTermsTestCases);
    const serializedTerms = serializeTerms(
      clonedFakeTermsTestCases, fakeCurrentTermCode, defaultPaginationQuery,
    );
    expect(serializedTerms).to.have.keys(getDefinitionProps('TermsResult'));

    const { links, meta, data } = serializedTerms;
    expect(links).to.contain.keys(_.keys(getDefinitionProps('PaginationLinks')));
    expect(meta).to.contain.keys(_.keys(getDefinitionProps('Meta')));
    expect(data).to.be.an('array');

    _.forEach(serializedTerms.data, termResource => checkTermSchema(termResource));
  });
  it('test serializeTerms', () => {
    const { serializeTerm } = termsSerializer;
    const { fakeTermsTestCases } = testData;

    _.forEach(fakeTermsTestCases, (fakeTermsTestCase) => {
      const serializedTerm = serializeTerm(fakeTermsTestCase);
      expect(serializedTerm).to.have.keys(getDefinitionProps('TermResult'));

      const { links, data } = serializedTerm;
      expect(links).to.contain.keys(_.keys(getDefinitionProps('SelfLink')));
      expect(data).to.be.an('object');

      checkTermSchema(data);
    });
  });
});
