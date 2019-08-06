const appRoot = require('app-root-path');

const termsDao = require('../../db/oracledb/terms-dao');

const { errorBuilder, errorHandler } = appRoot.require('errors/errors');

/**
 * Get term by term code
 *
 * @type RequestHandler
 */
const get = async (req, res) => {
  try {
    const { termCode } = req.params;
    const result = await termsDao.getTermByTermCode(termCode);
    if (!result) {
      errorBuilder(res, 404, 'A term with the specified term code was not found.');
    } else {
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

module.exports = { get };
