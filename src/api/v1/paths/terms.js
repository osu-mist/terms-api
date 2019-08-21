const appRoot = require('app-root-path');

const termsDao = require('../db/oracledb/terms-dao');

const { errorHandler } = appRoot.require('errors/errors');

/**
 * Get terms
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await termsDao.getTerms(req.query);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

module.exports = { get };
