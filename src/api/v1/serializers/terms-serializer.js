import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';
import moment from 'moment-timezone';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { paginate } from 'utils/paginator';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const termResourceProp = openapi.definitions.TermResource.properties;
const termResourceType = termResourceProp.type.enum[0];
const termResourceKeys = _.keys(termResourceProp.attributes.properties);
const termResourcePath = 'terms';
const termResourceUrl = resourcePathLink(apiBaseUrl, termResourcePath);

/**
 * A function to generate calendar year and season
 *
 * @param {object} rawTerm Raw term data rows from data source
 */
const generateCalendarYearAndSeason = (rawTerm) => {
  const { description } = rawTerm;
  const regex = /^(Summer|Fall|Winter|Spring) (\d{4})$/g;
  const match = regex.exec(description);
  rawTerm.season = match ? match[1] : null;
  rawTerm.calendarYear = match ? match[2] : null;
};

/**
 * A function to generate term status
 *
 * @param {object} rawTerm Raw term data rows from data source
 * @param {string} postCurrPreTermCodes post -nterim, current, and pre-interim term codes
 */
const generateTermStatus = (rawTerm, postCurrPreTermCodes) => {
  const today = Date.parse(moment().tz('PST8PDT').format('YYYY-MM-DD'));
  const registrationStartDate = Date.parse(rawTerm.registrationStartDate);
  const registrationEndDate = Date.parse(rawTerm.registrationEndDate);
  const status = [];

  const { termCode } = rawTerm;
  const { postInterimTermCode, currentTermCode, preInterimTermCode } = postCurrPreTermCodes;

  /**
   * If the current date is not during a break, currentTermCode, postInterimTermCode and
   * preInterimTermCode should be the same. (means the current term will have the all current,
   * post-interim, and pre-interim status).
   */
  if (termCode === currentTermCode) {
    status.push('current');
  }
  if (termCode === postInterimTermCode) {
    status.push('post-interim');
  }
  if (termCode === preInterimTermCode) {
    status.push('pre-interim');
  }

  if (registrationStartDate <= today && today <= registrationEndDate) {
    status.push('open');
  } else if (today > registrationEndDate) {
    status.push('completed');
  } else {
    status.push('not-open');
  }
  rawTerm.status = status;
};

/**
 * A function to serialize raw terms data
 *
 * @param {object[]} rawTerms Raw terms data rows from data source
 * @param {object} postCurrPreTermCodes post-interim, current, and pre-interim term codes
 * @param {object} query Query parameters
 * @returns {object} Serialized term resource data
 */
const serializeTerms = (rawTerms, postCurrPreTermCodes, query) => {
  /**
   * Calculate and generate fields for each term
   */
  _.forEach(rawTerms, (rawTerm) => {
    generateCalendarYearAndSeason(rawTerm);
    generateTermStatus(rawTerm, postCurrPreTermCodes);
  });

  /** Filter result if filter parameters are provided */
  // Return true if actual value is not matched with the query value
  const isNotExactlyMatch = (rawTerm, field) => query[field] && rawTerm[field] !== query[field];

  // Return true if date fall outside the range or the date ranges are null
  const isNotInRange = (rawTerm, field) => {
    const date = Date.parse(query[field]);
    let startDate;
    let endDate;

    switch (field) {
      case 'date':
        startDate = Date.parse(rawTerm.startDate);
        endDate = Date.parse(rawTerm.endDate);
        break;
      case 'housingDate':
        startDate = Date.parse(rawTerm.housingStartDate);
        endDate = Date.parse(rawTerm.housingEndDate);
        break;
      case 'registrationDate':
        startDate = Date.parse(rawTerm.registrationStartDate);
        endDate = Date.parse(rawTerm.registrationEndDate);
        break;
      default:
        throw new Error('Unexpected range filter.');
    }
    return query[field] && (startDate > date || endDate < date || !startDate || !endDate);
  };

  // Return true any of item from the actual list doesn't included in the query list
  const isNotInEnums = (rawTerm, field) => (
    query[field] && !_.some(rawTerm[field], (it) => _.includes(query[field], it))
  );

  _.remove(rawTerms, (rawTerm) => isNotExactlyMatch(rawTerm, 'academicYear')
                               || isNotExactlyMatch(rawTerm, 'calendarYear')
                               || isNotExactlyMatch(rawTerm, 'financialAidYear')
                               || isNotInRange(rawTerm, 'date')
                               || isNotInRange(rawTerm, 'housingDate')
                               || isNotInRange(rawTerm, 'registrationDate')
                               || isNotInEnums(rawTerm, 'status'));

  /** Add pagination links and meta information to options if pagination is enabled */
  const pageQuery = {
    size: query['page[size]'],
    number: query['page[number]'],
  };

  const pagination = paginate(rawTerms, pageQuery);
  pagination.totalResults = rawTerms.length;
  rawTerms = pagination.paginatedRows;

  let topLevelSelfLink;
  if (query && !_.isEmpty(query)) {
    topLevelSelfLink = paramsLink(termResourceUrl, query);
  } else {
    topLevelSelfLink = termResourceUrl;
  }

  const serializerArgs = {
    identifierField: 'termCode',
    resourceKeys: termResourceKeys,
    pagination,
    resourcePath: 'terms',
    topLevelSelfLink,
    query: _.omit(query, 'page[size]', 'page[number]'),
    enableDataLinks: true,
    resourceType: termResourceType,
  };

  return new JsonApiSerializer(
    termResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawTerms);
};

/**
 * A function to serialize raw term data
 *
 * @param {object} rawTerm Raw term data rows from data source
 * @param {string} postCurrPreTermCodes post-interim, current, and pre-interim term codes
 * @returns {object} Serialized term resource data
 */
const serializeTerm = (rawTerm, postCurrPreTermCodes) => {
  const topLevelSelfLink = resourcePathLink(termResourceUrl, rawTerm.termCode);
  const serializerArgs = {
    identifierField: 'termCode',
    resourceKeys: termResourceKeys,
    resourcePath: termResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
  };

  generateCalendarYearAndSeason(rawTerm);
  generateTermStatus(rawTerm, postCurrPreTermCodes);

  return new JsonApiSerializer(
    termResourceType,
    serializerOptions(serializerArgs, termResourcePath, topLevelSelfLink),
  ).serialize(rawTerm);
};

export {
  generateCalendarYearAndSeason,
  generateTermStatus,
  serializeTerms,
  serializeTerm,
};
