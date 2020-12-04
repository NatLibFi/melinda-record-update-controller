import {
  oaiPmhAutNamesUrl,
  oaiPmhAutNamesSet,
  oaiPmhBibUrl,
  oaiPmhBibSet,
  sruBibUrl,
  sruAutUrl,
  fintoUrl
} from './config';

// Source record harvester configs
// Oai-pmh auth-names
export const baseOaiPmhAutNamesSourceRecordHarvestConfig = {
  type: 'oai-pmh',
  url: oaiPmhAutNamesUrl,
  set: oaiPmhAutNamesSet,
  resumptionToken: {}
};

// Oai-pmh bib
export const baseOaiPmhBibSourceRecordHarvestConfig = {
  type: 'oai-pmh',
  url: oaiPmhBibUrl,
  set: oaiPmhBibSet,
  resumptionToken: {}
};

// Sru
// Link data harvester configs
export const baseSruAutHarvesterConfig = {
  type: 'sru',
  from: {tag: '100', value: {code: 'a'}}, // From sourceRecord to query
  queryFormat: 'dc.author=%s',
  url: sruBibUrl,
  offset: 0
};

// Job validation configs
export const sruJobValidationConfig = {
  queryFormat: 'rec.id=%s',
  url: sruAutUrl
};

// Finto
// Link data harvester variables
const fintoQueryFormat = `
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX yso: <http://www.yso.fi/onto/yso/>
SELECT DISTINCT *
FROM yso:
WHERE {
yso:%s skos:prefLabel ?label .
}`;

// Link data harvester configs
export const baseFintoHarvesterConfig = {
  type: 'finto',
  queryFormat: fintoQueryFormat,
  url: fintoUrl,
  collect: ['0'],
  from: {tag: '650', value: 'collect'} // From sourceRecord to query
};

export default function () {
  return {baseFintoHarvesterConfig, baseOaiPmhBibSourceRecordHarvestConfig, baseSruAutHarvesterConfig, sruJobValidationConfig, baseOaiPmhAutNamesSourceRecordHarvestConfig};
}
