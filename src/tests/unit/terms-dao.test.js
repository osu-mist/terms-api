import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { contrib } from 'api/v1/db/oracledb/contrib/contrib';

sinon.replace(config, 'get', () => ({ oracledb: {} }));

const connStub = {
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
};

const termsDao = proxyquire('../../api/v1/db/oracledb/terms-dao', {
  './connection': {
    getConnection: sinon.stub().resolves(connStub),
  },
});

const termsSerializer = require('../../api/v1/serializers/terms-serializer', {});

chai.should();
chai.use(chaiAsPromised);

describe('Test terms-dao', () => {
  afterEach(() => sinon.restore());

  it('getCurrentTermCode should be fulfilled', async () => {
    sinon.stub(contrib, 'getCurrentTerm').returns('currentTermCode');
    const fulfilledResult = termsDao.getCurrentTermCode(connStub);

    return fulfilledResult.should
      .eventually.be.fulfilled
      .and.deep.equal('fakeTermCode');
  });
  it('getCurrentTermCode should be rejected', async () => {
    const getCurrentTermStub = sinon.stub(contrib, 'getCurrentTerm');
    const rejectedCases = [
      { testCase: 'emptyResult', error: 'Expect a single object but got empty results.' },
      { testCase: 'singleResult', error: 'Result doesn\'t contain term code.' },
      { testCase: 'multiResults', error: 'Expect a single object but got multiple results.' },
    ];

    const rejectedPromises = [];
    _.each(rejectedCases, ({ testCase, error }, index) => {
      getCurrentTermStub.onCall(index).returns(testCase);

      const result = termsDao.getCurrentTermCode(connStub);
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
    const fulfilledResult = termsDao.getTerms();

    return fulfilledResult.should
      .eventually.be.fulfilled
      .and.deep.equal(expectResult);
  });
  it('getTerms should be rejected', () => {
    sinon.stub(contrib, 'getTerms').throws(new Error('Throw fake error.'));
    const rejectedResult = termsDao.getTerms();

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

      const result = termsDao.getTermByTermCode();
      fulfilledPromises.push(result.should
        .eventually.be.fulfilled
        .and.deep.equal(expected));
    });
    return Promise.all(fulfilledPromises);
  });
  it('getTermByTermCode should be rejected', () => {
    sinon.stub(contrib, 'getCurrentTerm').returns('currentTermCode');
    sinon.stub(contrib, 'getTerms').returns('multiResults');

    const result = termsDao.getTermByTermCode();

    return result.should
      .eventually.be.rejectedWith(Error, 'Expect a single object but got multiple results.');
  });
});
