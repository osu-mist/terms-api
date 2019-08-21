import _ from 'lodash';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import sinon from 'sinon';

import conn, { getConnection } from 'api/v1/db/oracledb/connection';
import { contrib } from 'api/v1/db/oracledb/contrib/contrib';
import { getTerms, getTermByTermCode, getCurrentTermCode } from 'api/v1/db/oracledb/terms-dao';
import termsSerializer from 'api/v1/serializers/terms-serializer';

sinon.replace(config, 'get', () => ({ oracledb: {} }));
chai.should();
chai.use(chaiAsPromised);

describe('Test terms-dao', () => {
  beforeEach(() => {
    sinon.stub(conn, 'getConnection').resolves({
      execute: (sql) => {
        const sqlResults = {
          multiResults: { rows: [{}, {}] },
          singleResult: { rows: [{}] },
          emptyResult: { rows: [] },
          currentTermCode: { rows: [{ termCode: 'fakeTermCode' }] },
        };
        return sql in sqlResults ? sqlResults[sql] : sqlResults.singleResult;
      },
      close: () => null,
    });
  });
  afterEach(() => sinon.restore());

  it('getCurrentTermCode should be fulfilled', async () => {
    const connection = await getConnection();

    sinon.stub(contrib, 'getCurrentTerm').returns('currentTermCode');
    const fulfilledResult = getCurrentTermCode(connection);

    return fulfilledResult.should
      .eventually.be.fulfilled
      .and.deep.equal('fakeTermCode');
  });
  it('getCurrentTermCode should be rejected', async () => {
    const connection = await getConnection();
    const getCurrentTermStub = sinon.stub(contrib, 'getCurrentTerm');
    const rejectedCases = [
      { testCase: 'emptyResult', error: 'Expect a single object but got empty results.' },
      { testCase: 'singleResult', error: 'Result doesn\'t contain term code.' },
      { testCase: 'multiResults', error: 'Expect a single object but got multiple results.' },
    ];

    const rejectedPromises = [];
    _.each(rejectedCases, ({ testCase, error }, index) => {
      getCurrentTermStub.onCall(index).returns(testCase);

      const result = getCurrentTermCode(connection);
      rejectedPromises.push(result.should
        .eventually.be.rejectedWith(Error, error));
    });
    return Promise.all(rejectedPromises);
  });
  it('getTerms should be fulfilled', () => {
    const expectResult = {};

    sinon.stub(contrib, 'getTerms').returns('multiResults');
    sinon.stub(contrib, 'getCurrentTerm').returns('currentTermCode');
    sinon.stub(termsSerializer, 'serializeTerms').returns(expectResult);
    const fulfilledResult = getTerms();

    return fulfilledResult.should
      .eventually.be.fulfilled
      .and.deep.equal(expectResult);
  });
  it('getTerms should be rejected', () => {
    sinon.stub(contrib, 'getTerms').throws(new Error('Throw fake error.'));
    const rejectedResult = getTerms();

    return rejectedResult.should
      .eventually.be.rejectedWith(Error);
  });
  it('getTermByTermCode should be fulfilled', () => {
    sinon.stub(contrib, 'getCurrentTerm').returns('currentTermCode');
    const getTermsStub = sinon.stub(contrib, 'getTerms');

    const expectedSerializedSingleTerm = {};
    const fulfilledCases = [
      // this test case won't call termsSerializer
      { testCase: 'emptyResult', expected: undefined },
      // this test case will require a call of termsSerializer
      { testCase: 'singleResult', expected: expectedSerializedSingleTerm },
    ];
    sinon.stub(termsSerializer, 'serializeTerm').onCall(0).returns(expectedSerializedSingleTerm);

    const fulfilledPromises = [];
    _.forEach(fulfilledCases, ({ testCase, expected }, index) => {
      getTermsStub.onCall(index).returns(testCase);

      const result = getTermByTermCode();
      fulfilledPromises.push(result.should
        .eventually.be.fulfilled
        .and.deep.equal(expected));
    });
    return Promise.all(fulfilledPromises);
  });
  it('getTermByTermCode should be rejected', () => {
    sinon.stub(contrib, 'getCurrentTerm').returns('currentTermCode');
    sinon.stub(contrib, 'getTerms').returns('multiResults');

    const result = getTermByTermCode();

    return result.should
      .eventually.be.rejectedWith(Error, 'Expect a single object but got multiple results.');
  });
});
