const appRoot = require('app-root-path');
const JsonApiSerializer = require('jsonapi-serializer').Serializer;
const _ = require('lodash');
const moment = require('moment-timezone');

const { serializerOptions } = appRoot.require('utils/jsonapi');
const { openapi } = appRoot.require('utils/load-openapi');
const { paginate } = appRoot.require('utils/paginator');
const { apiBaseUrl, resourcePathLink, paramsLink } = appRoot.require('utils/uri-builder');

const termResourceProp = openapi.definitions.TermResource.properties;
const termResourceType = termResourceProp.type.enum[0];
const termResourceKeys = _.keys(termResourceProp.attributes.properties);
const termResourcePath = 'terms';
const termResourceUrl = resourcePathLink(apiBaseUrl, termResourcePath);

/**
 * @summary A function to generate calendar year and season
 * @function
 * @param {Object} rawTerm Raw term data rows from data source
 */
const generateCalendarYearAndSeason = (rawTerm) => {
  const { description } = rawTerm;
  const regex = /^(Summer|Fall|Winter|Spring) (\d{4})$/g;
  const match = regex.exec(description);
  rawTerm.season = match ? match[1] : null;
  rawTerm.calendarYear = match ? match[2] : null;
};

/**
 * @summary A function to generate term status
 * @function
 * @param {Object} rawTerm Raw term data rows from data source
 * @param {string} currentTermCode current term code
 */
const generateTermStatus = (rawTerm, currentTermCode) => {
  const today = Date.parse(moment().tz('PST8PDT').format('YYYY-MM-DD'));
  const registrationStartDate = Date.parse(rawTerm.registrationStartDate);
  const registrationEndDate = Date.parse(rawTerm.registrationEndDate);
  const status = [];

  if (rawTerm.termCode === currentTermCode) {
    status.push('current');
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
 * @summary A function to serialize raw terms data
 * @function
 * @param {Object[]} rawTerms Raw terms data rows from data source
 * @param {string} currentTermCode current term code
 * @param {Object} query Query parameters
 * @returns {Object} Serialized term resource data
 */
const serializeTerms = (rawTerms, currentTermCode, query) => {
  /**
   * Calculate and generate fields for each term
   */
  _.forEach(rawTerms, (rawTerm) => {
    generateCalendarYearAndSeason(rawTerm);
    generateTermStatus(rawTerm, currentTermCode);
  });

  /**
   * Filter result if filter parameters are provided
   */
  /** Return true if actual value is not matched with the query value */
  const isNotExactlyMatch = (rawTerm, field) => query[field] && rawTerm[field] !== query[field];

  /** Return true if date fall outside the range or the date ranges are null */
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

  /** Return true any of item from the actual list doesn't included in the query list */
  const isNotInEnums = (rawTerm, field) => (
    query[field] && !_.some(rawTerm[field], it => _.includes(query[field], it))
  );

  _.remove(rawTerms, rawTerm => isNotExactlyMatch(rawTerm, 'academicYear')
                             || isNotExactlyMatch(rawTerm, 'calendarYear')
                             || isNotExactlyMatch(rawTerm, 'financialAidYear')
                             || isNotInRange(rawTerm, 'date')
                             || isNotInRange(rawTerm, 'housingDate')
                             || isNotInRange(rawTerm, 'registrationDate')
                             || isNotInEnums(rawTerm, 'status'));

  /**
   * Add pagination links and meta information to options if pagination is enabled
   */
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
    resourcePath: 'term',
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
 * @summary A function to serialize raw term data
 * @function
 * @param {Object} rawTerm Raw term data rows from data source
 * @param {string} currentTermCode current term code
 * @returns {Object} Serialized term resource data
 */
const serializeTerm = (rawTerm, currentTermCode) => {
  const topLevelSelfLink = resourcePathLink(termResourceUrl, rawTerm.termCode);
  const serializerArgs = {
    identifierField: 'termCode',
    resourceKeys: termResourceKeys,
    resourcePath: termResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
  };

  generateCalendarYearAndSeason(rawTerm);
  generateTermStatus(rawTerm, currentTermCode);

  return new JsonApiSerializer(
    termResourceType,
    serializerOptions(serializerArgs, termResourcePath, topLevelSelfLink),
  ).serialize(rawTerm);
};

module.exports = {
  generateCalendarYearAndSeason,
  generateTermStatus,
  serializeTerms,
  serializeTerm,
};
