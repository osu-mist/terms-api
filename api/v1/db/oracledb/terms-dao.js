const appRoot = require('app-root-path');
const _ = require('lodash');

const { serializeTerms, serializeTerm } = require('../../serializers/terms-serializer');

const { getConnection } = appRoot.require('api/v1/db/oracledb/connection');
const { contrib } = appRoot.require('api/v1/db/oracledb/contrib/contrib');

/**
 * @summary Return a list of terms
 * @function
 * @param {string} query
 * @returns {Promise} Promise object represents a list of terms
 */
const getTerms = query => new Promise(async (resolve, reject) => {
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(contrib.getTerms());
    const serializedTerms = serializeTerms(rows, query);
    resolve(serializedTerms);
  } catch (err) {
    reject(err);
  } finally {
    connection.close();
  }
});

/**
 * @summary Return a specific term by unique term code
 * @function
 * @param {string} termCode Unique term code
 * @returns {Promise} Promise object represents a specific pet
 */
const getTermByTermCode = termCode => new Promise(async (resolve, reject) => {
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(contrib.getTerms(termCode), [termCode]);

    if (_.isEmpty(rows)) {
      resolve(undefined);
    } else if (rows.length > 1) {
      reject(new Error('Expect a single object but got multiple results.'));
    } else {
      const [rawTerm] = rows;
      const serializedTerm = serializeTerm(rawTerm);
      resolve(serializedTerm);
    }
  } catch (err) {
    reject(err);
  } finally {
    connection.close();
  }
});

module.exports = { getTerms, getTermByTermCode };
