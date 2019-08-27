import _ from 'lodash';

import { serializeTerm, serializeTerms } from 'api/v1/serializers/terms-serializer';
import { getConnection } from './connection';
import { contrib } from './contrib/contrib';

/**
 * Get current term code
 *
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
 * Return a list of terms
 *
 * @param {string} query query
 * @returns {Promise<object[]>} Promise object represents a list of terms
 */
const getTerms = async (query) => {
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(contrib.getTerms());
    const currentTermCode = await getCurrentTermCode(connection);
    const serializedTerms = serializeTerms(rows, currentTermCode, query);
    return serializedTerms;
  } finally {
    connection.close();
  }
};

/**
 * Return a specific term by unique term code
 *
 * @param {string} termCode Unique term code
 * @returns {Promise<object>} Promise object represents a specific term or return undefined if term
 *                            is not found
 */
const getTermByTermCode = async (termCode) => {
  const connection = await getConnection();
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
      const serializedTerm = serializeTerm(rawTerm, currentTermCode);
      return serializedTerm;
    }
  } finally {
    connection.close();
  }
};

export {
  getCurrentTermCode,
  getTerms,
  getTermByTermCode,
};
