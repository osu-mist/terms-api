const appRoot = require('app-root-path');

const termsDao = require('../../db/oracledb/terms-dao');

const { errorBuilder, errorHandler } = appRoot.require('errors/errors');
const { openapi: { paths } } = appRoot.require('utils/load-openapi');

/**
 * @summary Get term by term code
 */
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await termsDao.getTermById(id);
    if (!result) {
      errorBuilder(res, 404, 'A term with the specified term code was not found.');
    } else {
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

get.apiDoc = paths['/terms/{id}'].get;

module.exports = { get };
