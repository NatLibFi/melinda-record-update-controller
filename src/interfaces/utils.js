import {MARCXML} from '@natlibfi/marc-record-serializers';
import {createLogger} from '@natlibfi/melinda-backend-commons';

const logger = createLogger();

export function getSruRecords(sruClient, query, offset) {
  return new Promise((resolve, reject) => {
    const records = [];
    sruClient.searchRetrieve(query, {startRecord: offset})
      .on('record', xmlString => {
        logger.log('silly', 'Got Record');
        records.push(MARCXML.from(xmlString), {subfieldValues: false}); // eslint-disable-line functional/immutable-data
      })
      .on('end', offset => {
        logger.log('info', 'Ending queries');
        resolve({offset, records});
      })
      .on('error', err => reject(err));
  });
}
