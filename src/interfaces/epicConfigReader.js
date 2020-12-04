/* eslint-disable no-unused-vars */

import fs from 'fs';
import path from 'path';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import epicConfigConstants from '../epicConfigConstants';
// baseFintoHarvesterConfig, baseOaiPmhBibSourceRecordHarvestConfig, baseSruAutHarvesterConfig, baseOaiPmhAutNamesSourceRecordHarvestConfig

export function readEpicConfig(filename) {
  const logger = createLogger();
  const configConstants = epicConfigConstants();
  const jsonEpicConfig = JSON.parse(fs.readFileSync(path.resolve(filename)), (key, value) => {
    if (Object.keys(configConstants).includes(value)) {
      logger.log('debug', `Replacing constant ${value} to config`);
      return configConstants[value];
    }
    return value;
  });
  // logger.log('debug', JSON.stringify(jsonEpicConfig, undefined, 2));
  return jsonEpicConfig;
}
