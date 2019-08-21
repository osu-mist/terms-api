import { errorBuilder, errorHandler } from 'errors/errors';
import { getTermByTermCode } from '../../db/oracledb/terms-dao';

/**
 * Get term by term code
 *
 * @type RequestHandler
 */
const get = async (req, res) => {
  try {
    const { termCode } = req.params;
    const result = await getTermByTermCode(termCode);
    if (!result) {
      errorBuilder(res, 404, 'A term with the specified term code was not found.');
    } else {
      res.send(result);
    }
  } catch (err) {
    errorHandler(res, err);
  }
};

export {
  get,
};
