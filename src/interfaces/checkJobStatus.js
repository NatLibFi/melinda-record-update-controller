import {COMMON_JOB_STATES, HARVESTER_JOB_STATES} from '@natlibfi/melinda-record-update-commons';
import {createLogger} from '@natlibfi/melinda-backend-commons';

export async function checkJobStatus(mongoOperator, jobs) {
  const logger = createLogger();
  const jobsDone = await mongoOperator.countByState(COMMON_JOB_STATES.DONE);
  const jobsAborted = await mongoOperator.countByState(COMMON_JOB_STATES.ABORTED);
  const jobsError = await mongoOperator.countByState(COMMON_JOB_STATES.ERROR);
  const jobsPending = await mongoOperator.countByState(COMMON_JOB_STATES.PENDING_ERATUONTI);
  const jobsPendingHarvester = await mongoOperator.countByState(HARVESTER_JOB_STATES.PENDING_SRU_HARVESTER);
  const jobsPreloaded = await mongoOperator.countByState(COMMON_JOB_STATES.PRELOADED);

  const jobsDefined = jobsDone + jobsError + jobsAborted;
  const jobsInProcess = jobs.length - jobsDone - jobsError - jobsAborted - jobsPreloaded;

  logger.info(`Jobs done total: ${(jobsDefined / jobs.length * 100).toFixed(2)}%`);
  logger.debug(`Jobs done total: ${jobsDone} / ${jobs.length}`);
  logger.debug(`Jobs aborted total: ${jobsAborted} / ${jobs.length}`);
  logger.debug(`Job errors total: ${jobsError} / ${jobs.length}`);
  logger.debug(`Jobs in process: ${jobsInProcess}`);
  logger.debug(`Jobs pending harvester: ${jobsPendingHarvester}`);
  logger.debug(`Jobs pending erätuonti: ${jobsPending}`);

  return {jobsInProcess};
}
