import { errorHandler } from 'errors/errors';
import { getTerms } from '../db/oracledb/terms-dao';

/**
 * Get terms
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getTerms(req.query);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export {
  get,
};
