import chai from 'chai';
import assertArrays from 'chai-arrays';
import chaiAsPromised from 'chai-as-promised';
import chaiDatetime from 'chai-datetime';
import _ from 'lodash';
import moment from 'moment-timezone';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import testData from 'tests/unit/test-data';
import { openapi } from 'utils/load-openapi';

chai.should();
chai.use(assertArrays);
chai.use(chaiAsPromised);
chai.use(chaiDatetime);
const { expect } = chai;

let termsSerializer;

describe('Test terms-serializer', () => {
  const { defaultPaginationQuery, fakePostCurrPreTermCodes } = testData;
  let clock;

  termsSerializer = proxyquire('../../api/v1/serializers/terms-serializer', {});

  /**
   * Helper function to get definition from openapi specification
   *
   * @param {string} definition the name of definition
   * @param {object} nestedOption nested option
   * @param {boolean} nestedOption.dataItem a boolean which represents whether it's a data item
   * @param {string} nestedOption.dataField data field name
   * @returns {object} the result of definition
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
   * Helper function to check the schema of term resource
   *
   * @param {object} resource resource to check
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

  beforeEach(() => {
    clock = sinon.useFakeTimers(moment.tz('2019-03-01', 'PST8PDT').toDate());
  });
  afterEach(() => {
    clock.restore();
  });

  it('test generateCalendarYearAndSeason', () => {
    const { generateCalendarYearAndSeasonTestCases } = testData;

    _.forEach(generateCalendarYearAndSeasonTestCases, ({ testCase, season, calendarYear }) => {
      termsSerializer.generateCalendarYearAndSeason(testCase);
      expect(testCase.season).to.equal(season);
      expect(testCase.calendarYear).to.equal(calendarYear);
    });
  });
  it('test generateTermStatus', () => {
    const { generateTermStatusTestCases } = testData;

    _.forEach(generateTermStatusTestCases, ({ testCase, status }) => {
      termsSerializer.generateTermStatus(testCase, fakePostCurrPreTermCodes);
      expect(testCase.status).to.be.containingAllOf(status);
    });
  });
  it('test serializeTerms', () => {
    const {
      fakeTermsTestCases,
      exactlyMatchQueryTestCases,
      inRangeQueryTestCases,
      inEnumsQueryTestCases,
    } = testData;

    /**
     * Helper function to call serializeTerms with test queries
     *
     * @param {object} testQuery test query
     * @returns {object} serializedData - object of serialized data and test case
     */
    const getSerializedData = (testQuery) => {
      const clonedFakeTermsTestCases = _.clone(fakeTermsTestCases);
      const query = { ...defaultPaginationQuery, ...testQuery };

      const { data } = termsSerializer.serializeTerms(
        clonedFakeTermsTestCases,
        fakePostCurrPreTermCodes,
        query,
      );
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
    const serializedTerms = termsSerializer.serializeTerms(
      clonedFakeTermsTestCases, fakePostCurrPreTermCodes, defaultPaginationQuery,
    );
    expect(serializedTerms).to.have.keys(getDefinitionProps('TermsResult'));

    const { links, meta, data } = serializedTerms;
    expect(links).to.contain.keys(_.keys(getDefinitionProps('PaginationLinks')));
    expect(meta).to.contain.keys(_.keys(getDefinitionProps('Meta')));
    expect(data).to.be.an('array');

    _.forEach(serializedTerms.data, (termResource) => checkTermSchema(termResource));
  });
  it('test serializeTerms', () => {
    const { fakeTermsTestCases } = testData;

    _.forEach(fakeTermsTestCases, (fakeTermsTestCase) => {
      const serializedTerm = termsSerializer.serializeTerm(
        fakeTermsTestCase,
        fakePostCurrPreTermCodes,
      );
      expect(serializedTerm).to.have.keys(getDefinitionProps('TermResult'));

      const { links, data } = serializedTerm;
      expect(links).to.contain.keys(_.keys(getDefinitionProps('SelfLink')));
      expect(data).to.be.an('object');

      checkTermSchema(data);
    });
  });
});
