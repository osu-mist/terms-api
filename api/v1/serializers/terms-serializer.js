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
const termResourcePath = 'term';
const termResourceUrl = resourcePathLink(apiBaseUrl, termResourcePath);

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
 * @param {[Object]} rawTerms Raw terms data rows from data source
 * @param {string} currentTermCode current term code
 * @param {Object} query Query parameters
 * @returns {Object} Serialized term resource data
 */
const serializeTerms = (rawTerms, currentTermCode, query) => {
  _.forEach(rawTerms, (rawTerm) => {
    generateTermStatus(rawTerm, currentTermCode);
  });

  const isNotExactlyMatch = (rawTerm, field) => query[field] && rawTerm[field] !== query[field];
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
      default:
        Error('Unexpected range filter.');
    }
    return startDate > date || endDate < date;
  };
  const isNotInEnums = (rawTerm, field) => (
    !_.some(rawTerm[field], it => _.includes(query[field], it))
  );

  _.remove(rawTerms, rawTerm => isNotExactlyMatch(rawTerm, 'academicYear')
                             || isNotExactlyMatch(rawTerm, 'calendarYear')
                             || isNotExactlyMatch(rawTerm, 'financialAidYear')
                             || isNotInRange(rawTerm, 'date')
                             || isNotInRange(rawTerm, 'housingDate')
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

  generateTermStatus(rawTerm, currentTermCode);

  return new JsonApiSerializer(
    termResourceType,
    serializerOptions(serializerArgs, termResourcePath, topLevelSelfLink),
  ).serialize(rawTerm);
};
module.exports = { serializeTerms, serializeTerm };
