import _ from 'lodash';

import { serializeTerm, serializeTerms } from 'api/v1/serializers/terms-serializer';
import { getConnection } from './connection';
import { contrib } from './contrib/contrib';

/**
 * Get post-interim, current, and pre-interim term codes
 *
 * @param {object} connection connection
 * @returns {object} post-interim, current, and pre-interim term codes
 */
const getPostCurrentPreInterimTermCodes = async (connection) => {
  const postPreInterimTerms = await connection.execute(contrib.getPostPreInterimTerms());
  const { postInterimTermCode, preInterimTermCode } = postPreInterimTerms.rows[0];
  let currentTermCode;
  if (postInterimTermCode === preInterimTermCode) {
    currentTermCode = postInterimTermCode;
  }
  return {
    postInterimTermCode,
    currentTermCode,
    preInterimTermCode,
  };
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
    const postCurrPreTermCodes = await getPostCurrentPreInterimTermCodes(connection);
    const serializedTerms = serializeTerms(rows, postCurrPreTermCodes, query);
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
    const postCurrPreTermCodes = await getPostCurrentPreInterimTermCodes(connection);

    if (_.isEmpty(rows)) {
      return undefined;
    }
    if (rows.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const [rawTerm] = rows;
      const serializedTerm = serializeTerm(rawTerm, postCurrPreTermCodes);
      return serializedTerm;
    }
  } finally {
    connection.close();
  }
};

export {
  getPostCurrentPreInterimTermCodes,
  getTerms,
  getTermByTermCode,
};
