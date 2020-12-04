/* eslint-disable no-unused-vars */
import {promisify} from 'util';
import {v4 as uuid} from 'uuid';
import {Error as LoaderError} from '@natlibfi/melinda-commons';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {COMMON_JOB_STATES} from '@natlibfi/melinda-record-link-migration-commons';
import sourceRecordHarvesterFactory from './sourceRecordHarvest';

export async function jobLoaderFactory(mongoOperator) {
  const setTimeoutPromise = promisify(setTimeout);
  const logger = createLogger();
  const sourceRecordHarvester = await sourceRecordHarvesterFactory();

  return {load};

  async function load({sourceHarvesting, linkDataHarvesting}) {
    const {linkDataHarvesterConfig, linkDataHarvesterApiProfileId, linkDataHarvesterValidationFilters} = linkDataHarvesting;
    // Get source record
    // Const {validSourcerecords, resumptionToken} = getTestRecords(); // Test
    const {validSourcerecords, resumptionToken, offset} = await getSourcerecords(sourceHarvesting);
    logger.log('debug', validSourcerecords.length);

    if (resumptionToken) { // eslint-disable-line functional/no-conditional-statement
      logger.log('verbose', `Oai-pmh harvest resumption token: ${resumptionToken}`);
    }

    if (offset) { // eslint-disable-line functional/no-conditional-statement
      logger.log('verbose', `Sru harvest offset: ${offset}`);
    }

    const jobs = await pumpJobs(validSourcerecords);

    return {resumptionToken, offset, jobs};

    async function pumpJobs(records, jobIds = []) {
      const [sourceRecord, ...rest] = records;
      if (sourceRecord === undefined) {
        logger.log('info', 'Jobs pumped!');
        return jobIds;
      }

      // Make jobs
      const jobs = linkDataHarvesterConfig.map(config => ({
        sourceRecord: sourceRecord.toObject(),
        linkDataHarvestSearch: config,
        linkDataHarvesterApiProfileId,
        linkDataHarvesterValidationFilters
      }));

      // Add jobs to mongo
      // More harvester config validation?
      const promicedJobIds = jobs.map(async job => {
        const jobId = uuid();
        await mongoOperator.create({jobId, jobState: COMMON_JOB_STATES.PRELOADED, jobConfig: job});
        await setTimeoutPromise(10);
        return jobId;
      });

      const newJobIds = await Promise.all(promicedJobIds);
      logger.log('debug', `Mongo jobIds: ${newJobIds}`);

      return pumpJobs(rest, [...jobIds, ...newJobIds]);
    }
  }

  async function getSourcerecords({sourceRecordHarvestConfig, sourceRecordValidationFilters}) {
    // OAI-PMH sourceRecords harvesting
    if (sourceRecordHarvestConfig.type === 'oai-pmh') {
      const sourceRecords = await sourceRecordHarvester.oaiPmhSourcerecordHarvesting({sourceRecordHarvestConfig, sourceRecordValidationFilters});
      return sourceRecords;
    }

    // SRU sourceRecords harvesting
    if (sourceRecordHarvestConfig.type === 'sru') {
      const sourceRecords = await sourceRecordHarvester.sruSourcerecordHarvesting({sourceRecordHarvestConfig, sourceRecordValidationFilters});
      return sourceRecords;
    }

    if (sourceRecordHarvestConfig.type === 'file') {
      const sourceRecords = await sourceRecordHarvester.fileSourcerecordHarvesting({sourceRecordHarvestConfig, sourceRecordValidationFilters});
      return sourceRecords;
    }

    throw new LoaderError(400, 'Invalid source record harvester settings');
  }
}
