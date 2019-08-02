const appRoot = require('app-root-path');
const _ = require('lodash');

const termsSerializer = require('../../serializers/terms-serializer');

const conn = appRoot.require('api/v1/db/oracledb/connection');
const { contrib } = appRoot.require('api/v1/db/oracledb/contrib/contrib');


/**
 * @summary Get current term code
 * @function
 * @param {object} connection connection
 * @returns {Promise<string>} current term code
 */
const getCurrentTermCode = async (connection) => {
  const { rows } = await connection.execute(contrib.getCurrentTerm());
  if (_.isEmpty(rows)) {
    throw new Error('Expect a single object but got empty results.');
  } else if (rows.length > 1) {
    throw new Error('Expect a single object but got multiple results.');
  } else if (rows[0].termCode === undefined) {
    throw new Error('Result doesn\'t contain term code.');
  }
  return rows[0].termCode;
};

/**
 * @summary Return a list of terms
 * @function
 * @param {string} query query
 * @returns {Promise<object[]>} Promise object represents a list of terms
 */
const getTerms = async (query) => {
  const connection = await conn.getConnection();
  try {
    const { rows } = await connection.execute(contrib.getTerms());
    const currentTermCode = await getCurrentTermCode(connection);
    const serializedTerms = termsSerializer.serializeTerms(rows, currentTermCode, query);
    return serializedTerms;
  } finally {
    connection.close();
  }
};

/**
 * @summary Return a specific term by unique term code
 * @function
 * @param {string} termCode Unique term code
 * @returns {Promise<object>} Promise object represents a specific term or return undefined if term
 *                            is not found
 */
const getTermByTermCode = async (termCode) => {
  const connection = await conn.getConnection();
  try {
    const { rows } = await connection.execute(contrib.getTerms(termCode), [termCode]);
    const currentTermCode = await getCurrentTermCode(connection);

    if (_.isEmpty(rows)) {
      return undefined;
    }
    if (rows.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const [rawTerm] = rows;
      const serializedTerm = termsSerializer.serializeTerm(rawTerm, currentTermCode);
      return serializedTerm;
    }
  } finally {
    connection.close();
  }
};

module.exports = {
  getCurrentTermCode,
  getTerms,
  getTermByTermCode,
};
