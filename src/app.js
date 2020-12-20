/* eslint-disable no-warning-comments */
import {promisify} from 'util';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {jobLoaderFactory} from './interfaces/jobLoader';
import {readEpicConfig} from './interfaces/epicConfigReader';
import {createMongoOperator, createEpicMongoOperator, EPIC_JOB_STATES} from '@natlibfi/melinda-record-update-commons';
import {checkJobStatus} from './interfaces/checkJobStatus';
import validateNextJob from './interfaces/validateJob';

export default async function ({mongoUrl, epicConfigFile, maxJobsInProcess}) {
  const setTimeoutPromise = promisify(setTimeout);
  const logger = createLogger();
  const mongoOperator = await createMongoOperator(mongoUrl);
  const epicMongoOperator = await createEpicMongoOperator(mongoUrl);
  const jobLoader = await jobLoaderFactory(mongoOperator);

  logger.log('info', `Starting job controller - config file: ${epicConfigFile}`);
  await loop();

  async function loop() {
    // Mongo get epicConfigFile
    const epicJob = await epicMongoOperator.getByEpicConfigFile({epicConfigFile});
    //logger.debug(JSON.stringify(epicJob));

    // if epic-item null -> readEpicConfig
    if (epicJob === null) { // eslint-disable-line functional/no-conditional-statement
      await createEpic();
      return loop();
    }

    // if epic-item loading -> load
    if (epicJob.epicState === EPIC_JOB_STATES.LOADING) {
      return stateLoading(epicJob);
    }

    // if epic-item process -> check job status & launch jobs if needed
    if (epicJob.epicState === EPIC_JOB_STATES.IN_PROCESS) {
      logger.log('info', `Got ${epicJob.jobs.length} jobs to do`);
      const {jobsInProcess} = await checkJobStatus(mongoOperator, epicJob.jobs, epicJob.jobsDone);

      if (jobsInProcess < maxJobsInProcess) { // eslint-disable-line functional/no-conditional-statement
        logger.log('info', 'Validating new job')
        await validateNextJob(mongoOperator, epicJob.sourceHarvesting.sourceRecordValidationConfig);
        return loop();
      }
    }

    // loop
    // logger.log('debug', JSON.stringify(epicConfig, undefined, 2));
    await setTimeoutPromise(10000);
    return loop();
  }

  function createEpic() {
    logger.log('debug', 'No job -> generating one');
    const {sourceHarvesting, linkDataHarvesting} = readEpicConfig(epicConfigFile);
    return epicMongoOperator.createEpic({epicConfigFile, sourceHarvesting, linkDataHarvesting});
  }

  async function stateLoading(epicJob) {

    const {sourceHarvesting, linkDataHarvesting} = epicJob;
    // logger.debug(JSON.stringify(sourceHarvesting));
    // logger.debug(JSON.stringify(linkDataHarvesting));

    // Should not happen
    if (
      sourceHarvesting === null ||
      linkDataHarvesting === null ||
      sourceHarvesting === undefined ||
      linkDataHarvesting === undefined
    ) { // eslint-disable-line functional/no-conditional-statement
      logger.log('debug', 'Broken job');
      await epicMongoOperator.removeEpic({epicConfigFile});
      throw Error('shutdown');
    }

    logger.log('info', `Offset: ${sourceHarvesting.sourceRecordHarvestConfig.offset ? sourceHarvesting.sourceRecordHarvestConfig.offset : sourceHarvesting.sourceRecordHarvestConfig.resumptionToken.cursor}`);
    if (sourceHarvesting.sourceRecordHarvestConfig.type === 'oai-pmh') {
      return loadOaipmh();
    }

    if (sourceHarvesting.sourceRecordHarvestConfig.type === 'sru') {
      return loadSru();
    }

    throw Error('Shutdown');

    async function loadOaipmh() {
      // {resumptiontoken, ids} -> update resumption + ids
      const {resumptionToken, jobs} = await jobLoader.load({sourceHarvesting, linkDataHarvesting});
      logger.log('debug', `New load resumption token to epic: ${JSON.stringify(resumptionToken)}`);
      // logger.log('debug', `new jobs to epic: ${jobs}`);
      await epicMongoOperator.pushJobs({epicConfigFile, jobs});

      if (resumptionToken === undefined) { // eslint-disable-line functional/no-conditional-statement
        logger.log('info', 'Job loading done!');
        await epicMongoOperator.setState({epicConfigFile, epicState: EPIC_JOB_STATES.IN_PROCESS});
        throw Error('Start harvest loop!');
      }

      await epicMongoOperator.updateResumptionData({epicConfigFile, resumptionToken});

      return loop();
    }

    async function loadSru() {
      // {resumptiontoken, ids} -> update resumption + ids
      const {offset, jobs} = await jobLoader.load({sourceHarvesting, linkDataHarvesting});
      logger.log('debug', `New load offset to epic: ${JSON.stringify(offset)}`);
      // logger.log('debug', `new jobs to epic: ${jobs}`);
      await epicMongoOperator.pushJobs({epicConfigFile, jobs});

      if (offset === undefined) {
        logger.log('info', 'Job loading done!');
        return epicMongoOperator.setState({epicConfigFile, epicState: EPIC_JOB_STATES.IN_PROCESS});
      }

      await epicMongoOperator.updateResumptionData({epicConfigFile, offset});

      return loop();
    }
  }
}
