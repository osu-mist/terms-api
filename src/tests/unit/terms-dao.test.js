import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { contrib } from 'api/v1/db/oracledb/contrib/contrib';

chai.should();
chai.use(chaiAsPromised);

describe('Test terms-dao', () => {
  sinon.replace(config, 'get', () => ({ oracledb: {} }));
  const connStub = {
    execute: (sql) => {
      const sqlResults = {
        multiResults: { rows: [{}, {}] },
        singleResult: { rows: [{}] },
        emptyResult: { rows: [] },
        postCurrPreTermCodes: {
          rows: [
            {
              postInterimTermCode: 'fakeTermCode',
              preInterimTermCode: 'fakeTermCode',
            },
          ],
        },
      };
      return sql in sqlResults ? sqlResults[sql] : sqlResults.singleResult;
    },
    close: () => null,
  };
  const termsDao = proxyquire('../../api/v1/db/oracledb/terms-dao', {
    './connection': {
      getConnection: sinon.stub().resolves(connStub),
    },
    '../../serializers/terms-serializer': {
      serializeTerm: (rawTerm) => rawTerm,
      serializeTerms: (rawTerms) => rawTerms,
    },
  });

  afterEach(() => sinon.restore());

  it('getPostCurrentPreInterimTermCodes should be fulfilled', async () => {
    sinon.stub(contrib, 'getPostPreInterimTerms').returns('postCurrPreTermCodes');
    const fulfilledResult = termsDao.getPostCurrentPreInterimTermCodes(connStub);

    return fulfilledResult.should
      .eventually.be.fulfilled
      .and.deep.equal({
        postInterimTermCode: 'fakeTermCode',
        currentTermCode: 'fakeTermCode',
        preInterimTermCode: 'fakeTermCode',
      });
  });
  it('getTerms should be fulfilled', () => {
    const expectResult = [{}, {}];

    sinon.stub(contrib, 'getTerms').returns('multiResults');
    sinon.stub(contrib, 'getPostPreInterimTerms').returns('postCurrPreTermCodes');
    sinon.stub(contrib, 'getPostInterimTermOfDate').returns('fakeTermCode');
    sinon.stub(contrib, 'getPreInterimTermOfDate').returns('fakeTermCode');
    const fulfilledResult = termsDao.getTerms({});

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
    sinon.stub(contrib, 'getPostPreInterimTerms').returns('postCurrPreTermCodes');
    const getTermsStub = sinon.stub(contrib, 'getTerms');

    const expectedSerializedSingleTerm = {};
    const fulfilledCases = [
      // this test case won't call termsSerializer
      { testCase: 'emptyResult', expected: undefined },
      // this test case will require a call of termsSerializer
      { testCase: 'singleResult', expected: expectedSerializedSingleTerm },
    ];

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
    sinon.stub(contrib, 'getPostPreInterimTerms').returns('postCurrPreTermCodes');
    sinon.stub(contrib, 'getTerms').returns('multiResults');

    const result = termsDao.getTermByTermCode();

    return result.should
      .eventually.be.rejectedWith(Error, 'Expect a single object but got multiple results.');
  });
});
