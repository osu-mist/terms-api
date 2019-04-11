const appRoot = require('app-root-path');
const JsonApiSerializer = require('jsonapi-serializer').Serializer;
const _ = require('lodash');

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
 * @summary A function to serialize raw terms data
 * @function
 * @param {[Object]} rawTerms Raw terms data rows from data source
 * @param {Object} query Query parameters
 * @returns {Object} Serialized term resource data
 */
const serializeTerms = (rawTerms, query) => {
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
 * @returns {Object} Serialized term resource data
 */
const serializeTerm = (rawTerm) => {
  const topLevelSelfLink = resourcePathLink(termResourceUrl, rawTerm.termCode);
  const serializerArgs = {
    identifierField: 'termCode',
    resourceKeys: termResourceKeys,
    resourcePath: termResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    termResourceType,
    serializerOptions(serializerArgs, termResourcePath, topLevelSelfLink),
  ).serialize(rawTerm);
};
module.exports = { serializeTerms, serializeTerm };
