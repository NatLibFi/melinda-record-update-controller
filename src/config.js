import {readEnvironmentVariable} from '@natlibfi/melinda-backend-commons';

// Api client variables
export const apiUrl = readEnvironmentVariable('API_URL');
export const apiUsername = readEnvironmentVariable('API_USERNAME');
export const apiPassword = readEnvironmentVariable('API_PASSWORD');
export const apiClientUserAgent = readEnvironmentVariable('API_CLIENT_USER_AGENT', {defaultValue: '_RECORD-UPDATE'});

// Config file variables
export const epicConfigFile = readEnvironmentVariable('EPIC_CONFIG_FILE');
export const maxJobsInProcess = readEnvironmentVariable('MAX_JOBS_IN_PROCESS', {defaultValue: 4, format: v => Number(v)});

// Mongo variables to job
export const mongoUrl = readEnvironmentVariable('MONGO_URI', {defaultValue: 'mongodb://127.0.0.1:27018/db'});

// OAI-PMH connection variables
export const oaiPmhAutNamesUrl = readEnvironmentVariable('OAI_PMH_AUT_NAMES_URL', {defaultValue: 'OAI_PMH_AUT_NAMES_URL MISSING'});
export const oaiPmhAutNamesSet = readEnvironmentVariable('OAI_PMH_AUT_NAMES_SET', {defaultValue: 'OAI_PMH_AUT_NAMES_SET MISSING'});
export const oaiPmhBibUrl = readEnvironmentVariable('OAI_PMH_BIB_URL', {defaultValue: 'OAI_PMH_BIB_URL MISSING'});
export const oaiPmhBibSet = readEnvironmentVariable('OAI_PMH_BIB_SET', {defaultValue: 'OAI_PMH_BIB_SET MISSING'});

// SRU connection variables
export const sruBibUrl = readEnvironmentVariable('SRU_BIB_URL', {defaultValue: 'SRU_BIB_URL MISSING'});
export const sruAutUrl = readEnvironmentVariable('SRU_AUT_URL', {defaultValue: 'SRU_AUT_URL MISSING'});

// FINTO connection variables
export const fintoUrl = readEnvironmentVariable('FINTO_URL', {defaultValue: 'FINTO_URL MISSING'});
