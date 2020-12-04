import {createLogger} from '@natlibfi/melinda-backend-commons';
import createOaiPmhClient from '@natlibfi/oai-pmh-client';
import createSruClient from '@natlibfi/sru-client';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import {createValidationFactory, logError} from '@natlibfi/melinda-record-link-migration-commons';
import {MarcRecord} from '@natlibfi/marc-record';
import fs from 'fs';
import path from 'path';
import {format} from 'util';
import {getSruRecords} from './utils';

export default function () {
  const logger = createLogger();

  return {fileSourcerecordHarvesting, sruSourcerecordHarvesting, oaiPmhSourcerecordHarvesting};

  // Works
  async function fileSourcerecordHarvesting({sourceRecordHarvestConfig, sourceRecordValidationFilters}) {
    logger.log('info', 'Harvesting source records from FILE');
    logger.log('silly', JSON.stringify(sourceRecordHarvestConfig));
    logger.log('silly', JSON.stringify(sourceRecordValidationFilters));
    const filepath = path.resolve(sourceRecordHarvestConfig.location);
    const file = fs.readFileSync(filepath);
    const jsonFile = JSON.parse(file.toString());
    const records = jsonFile.map(record => new MarcRecord(record));
    const validators = await Promise.all(sourceRecordValidationFilters.map(validationFilter => createValidationFactory(validationFilter)));
    const validSourcerecords = await filterValidRecords(records, validators);
    logger.log('info', `Got ${validSourcerecords.length} valid source records file`);

    return {validSourcerecords};
  }

  // Proto
  async function sruSourcerecordHarvesting({sourceRecordHarvestConfig, sourceRecordValidationFilters}) {
    logger.log('info', 'Harvesting source records from SRU');
    logger.log('silly', JSON.stringify(sourceRecordHarvestConfig));
    logger.log('silly', JSON.stringify(sourceRecordValidationFilters));
    const {queryFormat, list, offset} = sourceRecordHarvestConfig;
    const sruClient = createSruClient({
      url: sourceRecordHarvestConfig.url,
      recordSchema: 'marcxml',
      maxRecordsPerRequest: 50,
      retrieveAll: false
    });

    logger.log('info', 'Generating queries');
    const querys = list.map(id => format(queryFormat, id));
    const [query] = querys;
    const {records} = await getSruRecords(sruClient, query, offset);

    return {records};
  }

  // Works
  async function oaiPmhSourcerecordHarvesting({sourceRecordHarvestConfig, sourceRecordValidationFilters}) {
    logger.log('info', 'Harvesting source records from OAI-PMH');
    logger.log('silly', JSON.stringify(sourceRecordHarvestConfig));
    logger.log('silly', JSON.stringify(sourceRecordValidationFilters));
    const oaiPmhClient = createOaiPmhClient({
      url: sourceRecordHarvestConfig.url,
      set: sourceRecordHarvestConfig.set,
      metadataPrefix: 'melinda_marc',
      metadataFormat: 'string',
      retrieveAll: false,
      filterDeleted: true
    });

    // Get auth records
    const {records, resumptionToken} = await getOaiPMhRecords(sourceRecordHarvestConfig.resumptionToken);

    // Validate auth records
    const validators = await Promise.all(sourceRecordValidationFilters.map(validationFilter => createValidationFactory(validationFilter)));
    const validSourcerecords = await filterValidRecords(records, validators);

    // Return valid auth records
    return {validSourcerecords, resumptionToken};

    function getOaiPMhRecords(resumptionToken) { // eslint-disable-line no-unused-vars
      if (resumptionToken.token !== undefined) {
        logger.log('info', 'Connect to OAI-PMH and using resumptionToken');
        logger.log('silly', JSON.stringify(resumptionToken));
        return new Promise((resolve, reject) => {
          const records = [];
          const promises = [];
          oaiPmhClient.listRecords({resumptionToken})
            .on('record', record => {
              promises.push(transform(record.metadata)); // eslint-disable-line functional/immutable-data
              async function transform(xmlStringRecord) {
                const record = await MARCXML.from(xmlStringRecord);
                records.push(record); // eslint-disable-line functional/immutable-data
              }
            }) // eslint-disable-line functional/immutable-data
            .on('end', resumptionToken => endProcessing(resumptionToken))
            .on('error', err => handleError(err));

          async function endProcessing(resumptionToken) {
            logger.log('info', 'Got records from OAI-PMH');
            await Promise.all(promises);
            resolve({records, resumptionToken});
          }

          function handleError(err) {
            logError(err);
            reject(err);
          }
        });
      }

      logger.log('info', 'Connect to OAI-PMH');
      return new Promise((resolve, reject) => {
        const promises = [];
        const records = [];
        oaiPmhClient.listRecords()
          .on('record', record => {
            promises.push(transform(record.metadata)); // eslint-disable-line functional/immutable-data
            async function transform(xmlStringRecord) {
              const record = await MARCXML.from(xmlStringRecord);
              records.push(record); // eslint-disable-line functional/immutable-data
            }
          })
          .on('end', resumptionToken => endProcessing(resumptionToken))
          .on('error', err => handleError(err));

        async function endProcessing(resumptionToken) {
          logger.log('info', 'Got records from OAI-PMH');
          await Promise.all(promises);
          resolve({records, resumptionToken});
        }

        function handleError(err) {
          logError(err);
          reject(err);
        }
      });
    }
  }

  async function filterValidRecords(records, validators, validRecords = []) {
    const [record, ...rest] = records;
    if (record === undefined) {
      return validRecords;
    }
    // Filter records
    try {
      const results = await Promise.all(validators.map(async validate => {
        const validationResults = await validate(record, {fix: false, validateFixes: false});

        // Logger.log('silly', JSON.stringify(validationResults));
        const {valid, report} = validationResults;
        if (valid) { // eslint-disable-line
          logger.log('debug', `Record validation: ${valid}`);
          // Logger.log('silly', JSON.stringify(record));
          logger.log('silly', JSON.stringify(report));
          const [f100] = record.get(/^100$/u);
          logger.log('silly', JSON.stringify(f100));
          return true;
        }
        logger.log('silly', `Record validation: ${valid}`);
        return false;
      }));

      if (results.includes(true)) {
        return filterValidRecords(rest, validators, [...validRecords, record]);
      }
    } catch (error) {
      logger.log('error', JSON.stringify(record));
      logger.log('error', error);
    }

    return filterValidRecords(rest, validators, validRecords);
  }
}
