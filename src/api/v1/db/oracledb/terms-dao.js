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
 * Get interim term of date
 *
 * @param {object} connection connection
 * @param {string} interimTermDate interim term date
 * @param {Function} sql sql statement to be executed
 * @returns {Promise<string>} Promise string represents the interim term of the date
 */
const getInterimTermOfDate = async (connection, interimTermDate, sql) => {
  if (interimTermDate) {
    const rawInterimTermCode = await connection.execute(sql(interimTermDate));
    return rawInterimTermCode.rows[0].interimTermCode;
  }
  return undefined;
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
    const postCurrPreTermCodes = await getPostCurrentPreInterimTermCodes(connection);

    const { postInterimTermDate, preInterimTermDate } = query;

    const postInterimTermOfDate = await getInterimTermOfDate(
      connection, postInterimTermDate, contrib.getPostInterimTermOfDate,
    );
    const preInterimTermOfDate = await getInterimTermOfDate(
      connection, preInterimTermDate, contrib.getPreInterimTermOfDate,
    );

    /**
     * If postInterimTermOfDate and preInterimTermOfDate point to different terms, return an empty
     * array since it's not possible to have a term that qualifies both conditions at the same time.
     */
    if (
      (postInterimTermOfDate && preInterimTermOfDate)
      && postInterimTermOfDate !== preInterimTermOfDate
    ) {
      return serializeTerms([], postCurrPreTermCodes, query);
    }
    const termCode = postInterimTermOfDate || preInterimTermOfDate;

    let rawTerms;
    if (termCode) {
      rawTerms = await connection.execute(contrib.getTerms(termCode), [termCode]);
    } else {
      rawTerms = await connection.execute(contrib.getTerms());
    }

    return serializeTerms(rawTerms.rows, postCurrPreTermCodes, query);
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
