import {COMMON_JOB_STATES} from '@natlibfi/melinda-record-link-migration-commons';
import {HARVESTER_JOB_STATES} from '@natlibfi/melinda-record-link-migration-commons/dist/constants';
import {format} from 'util';
import {getSruRecords} from './utils';
import {MarcRecord} from '@natlibfi/marc-record';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import createSruClient from '@natlibfi/sru-client';

export default async function (mongoOperator, sourceRecordValidationConfig) {
  const logger = createLogger();
  const preloadedJob = await mongoOperator.getOne(COMMON_JOB_STATES.PRELOADED);
  // get source record id
  const {sourceRecord, linkDataHarvestSearch, linkDataHarvesterApiProfileId, linkDataHarvesterValidationFilters} = preloadedJob.jobConfig;
  const marcSourceRecord = new MarcRecord(sourceRecord, {subfieldValues: false});
  const [f001] = marcSourceRecord.get('001');
  // sru get record
  const sruRecord = await getRecordFromSru(f001.value, sourceRecordValidationConfig);
  // compare records
  if (!marcSourceRecord.equalsTo(sruRecord)) {
    // update job if needed
    logger.log('debug', 'Updating source record');
    const newJobConfig = {
      sourceRecord: sruRecord.toObject(),
      linkDataHarvestSearch,
      linkDataHarvesterApiProfileId,
      linkDataHarvesterValidationFilters
    };

    await mongoOperator.updateJobConfig({jobId: preloadedJob.jobId, jobConfig: newJobConfig});
    return setJobPendingHarvesting(preloadedJob.jobId, linkDataHarvestSearch.type);
  }

  return setJobPendingHarvesting(preloadedJob.jobId, linkDataHarvestSearch.type);

  function setJobPendingHarvesting(jobId, type) {
    if (type === 'sru') {
      logger.log('debug', 'Setting up SRU harvester job');
      return mongoOperator.setState({jobId, state: HARVESTER_JOB_STATES.PENDING_SRU_HARVESTER});
    }
    if (type === 'oai-pmh') {
      logger.log('debug', 'Setting up OAI-PMH harvester job');
      return mongoOperator.setState({jobId, state: HARVESTER_JOB_STATES.PENDING_OAI_PMH_HARVESTER});
    }
    if (type === 'finto') {
      logger.log('debug', 'Setting up FINTO harvester job');
      return mongoOperator.setState({jobId, state: HARVESTER_JOB_STATES.PENDING_FINTO_HARVESTER});
    }

    throw new Error('Invalid harvester settings');
  }

  async function getRecordFromSru(sourceId, sourceRecordValidationConfig) {
    const sruClient = createSruClient({
      url: sourceRecordValidationConfig.url,
      recordSchema: 'marcxml',
      maxRecordsPerRequest: 1
    });
    const query = format(sourceRecordValidationConfig.queryFormat, sourceId);

    const {records} = await getSruRecords(sruClient, query, 0);
    const [record] = records;
    return record;
  }
}
