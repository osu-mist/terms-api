import _ from 'lodash';

import { serializeTerm, serializeTerms } from 'api/v1/serializers/terms-serializer';
import { getConnection } from './connection';
import { contrib } from './contrib/contrib';

/**
 * Get post interim, current, and prev interim term codes
 *
 * @param {object} connection connection
 * @returns {object} post interim, current, and prev interim term codes
 */
const getPostCurrentPrevInterimTermCodes = async (connection) => {
  const postPrevInterimTerms = await connection.execute(contrib.getPostPrevInterimTerms());
  const { postInterimTermCode, prevInterimTermCode } = postPrevInterimTerms.rows[0];
  let currentTermCode;
  if (postInterimTermCode === prevInterimTermCode) {
    currentTermCode = postInterimTermCode;
  }
  return {
    postInterimTermCode,
    currentTermCode,
    prevInterimTermCode,
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
    const postCurrPrevTermCodes = await getPostCurrentPrevInterimTermCodes(connection);
    const serializedTerms = serializeTerms(rows, postCurrPrevTermCodes, query);
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
    const postCurrPrevTermCodes = await getPostCurrentPrevInterimTermCodes(connection);

    if (_.isEmpty(rows)) {
      return undefined;
    }
    if (rows.length > 1) {
      throw new Error('Expect a single object but got multiple results.');
    } else {
      const [rawTerm] = rows;
      const serializedTerm = serializeTerm(rawTerm, postCurrPrevTermCodes);
      return serializedTerm;
    }
  } finally {
    connection.close();
  }
};

export {
  getPostCurrentPrevInterimTermCodes,
  getTerms,
  getTermByTermCode,
};
