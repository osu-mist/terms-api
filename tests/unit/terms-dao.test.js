const appRoot = require('app-root-path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('config');
const _ = require('lodash');
const sinon = require('sinon');

sinon.replace(config, 'get', () => ({ oracledb: {} }));
const conn = appRoot.require('api/v1/db/oracledb/connection');
const { contrib } = appRoot.require('api/v1/db/oracledb/contrib/contrib');
const termsDao = appRoot.require('api/v1/db/oracledb/terms-dao');
const termsSerializer = appRoot.require('api/v1/serializers/terms-serializer');

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
  it('getTerms should be rejected if an error was thrown', () => {
    sinon.stub(contrib, 'getTerms').throws(new Error('Throw fake error.'));
    const rejectedResult = termsDao.getTerms();

    return rejectedResult.should
      .eventually.be.rejectedWith(Error);
  });
  it('getCurrentTermCode should be fulfilled', async () => {
    const connection = await conn.getConnection();

    sinon.stub(contrib, 'getCurrentTerm').returns('currentTermCode');
    const fulfilledResult = termsDao.getCurrentTermCode(connection);

    return fulfilledResult.should
      .eventually.be.fulfilled
      .and.deep.equal('fakeTermCode');
  });
  it('getCurrentTermCode should be rejected if an error was thrown', async () => {
    const connection = await conn.getConnection();
    const rejectedCases = [
      { testCase: 'emptyResult', error: 'Expect a single object but got empty results.' },
      { testCase: 'singleResult', error: 'Result doesn\'t contain term code' },
      { testCase: 'multiResults', error: 'Expect a single object but got multiple results.' },
    ];

    const rejectedPromises = [];
    _.each(rejectedCases, ({ testCase, error }) => {
      sinon.stub(contrib, 'getCurrentTerm').returns(testCase);
      const result = termsDao.getCurrentTermCode(connection);

      rejectedPromises.push(result.should
        .eventually.be.rejectedWith(Error, error));

      sinon.restore();
    });
    return Promise.all(rejectedPromises);
  });

  afterEach(() => sinon.restore());
});
