const appRoot = require('app-root-path');

const termsDao = require('../db/oracledb/terms-dao');

const { errorHandler } = appRoot.require('errors/errors');
const { openapi: { paths } } = appRoot.require('utils/load-openapi');

/**
 * @summary Get terms
 */
const get = async (req, res) => {
  try {
    const result = await termsDao.getTerms(req.query);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

get.apiDoc = paths['/terms'].get;

module.exports = { get };
