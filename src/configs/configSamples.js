/*

// AccessRights,DoubleCommas, DuplicatesInd1, EmptyFields, EndingPunctuation, FieldExclusion,
// FieldsPresent, FieldStructure, FixedFields, IdenticalFields, IsbnIssn, ItemLanguage,
// Punctuation, ResolvableExtReferences, SortTags, SubfieldExclusion, UnicodeDecomposition, Urn

JobState: PENDING_SRU_HARVESTER or PENDING_OAI_PMH_HARVESTER
jobConfig:{blobIds, sourceFile, linkDataHarvesterApiProfileId, linkDataHarvestSearch, linkDataHarvesterValidationFilter, changes}

Epic:
epicId:
repeat: false,
status: null,
epicConfig: {
  sourceRecordHarvestConfig
  sourceRecordValidationFilter
  linkDataHarvesterConfig: [{from, query, url} or {searchSet, url}]
  linkDataHarvesterApiProfileId
  linkDataHarvesterValidationFilters:{changes}
}
*/

import {baseFintoHarvesterConfig, baseOaiPmhBibSourceRecordHarvestConfig, baseSruAutHarvesterConfig, baseOaiPmhAutNamesSourceRecordHarvestConfig} from '../epicConfigConstants';

export const epicTemplate = {
  sourceRecordHarvestConfig: {},
  sourceRecordValidationFilters: {},
  linkDataHarvesterConfig: [
    {type: 'sru', from: {}, queryFormat: '', url: ''},
    {type: 'oai-pmh', set: '', url: '', resumptionToken: ''},
    {type: 'finto', from: {}, queryFormat: '', url: ''}
  ],
  linkDataHarvesterApiProfileId: '',
  linkDataHarvesterValidationFilters: [{changes: {}}]
};

// ^(100|600|700)$

export const testEpic = {
  sourceRecordHarvestConfig: baseOaiPmhAutNamesSourceRecordHarvestConfig,
  sourceRecordValidationFilters: [
    {
      fieldsPresent: ['^100$'],
      subfieldExclusion: [{tag: '^100$', subfields: [{code: 't'}]}],
      fieldStructure: [{tag: '^040$', subfields: {a: {required: true, pattern: '^(?:FI-NLD)$'}}}]
    },
    {
      fieldsPresent: ['^100$'],
      subfieldExclusion: [{tag: '^100$', subfields: [{code: 't'}]}],
      fieldStructure: [{tag: '^040$', subfields: {d: {required: true, pattern: '^(?:FI-NLD)$'}}}]
    }
  ],
  linkDataHarvesterConfig: [baseSruAutHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '^(100|600|700)$', value: 'collect'}
      },
      fieldsPresent: ['^(100|600|700)$', '^042$'],
      fieldStructure: [{tag: '^042$', subfields: {a: {pattern: '^(?:finbd)'}}}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From source record
          to: {
            tag: '^(100|600|700)$', value: {code: '0'}, format: `(FI-ASTERI-N)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '^(100|600|700)$', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', {code: '0', value: '^\\(FI-ASTERI-N\\)'}, '0'] // Subfield sort order after modify
        },
        {
          removeSubfields: {tag: '^(100|600|700)$', code: '0', value: '^\\d+$'}
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '^(100|600|700)$', value: 'collect'}
      },
      fieldsPresent: ['^(100|600|700)$', '^035$'],
      fieldStructure: [{tag: '^035$', subfields: {a: {pattern: '^\\(FI-VIOLA\\)\\d+'}}}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From source record
          to: {
            tag: '^(100|600|700)$', value: {code: '0'}, format: `(FI-ASTERI-N)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '^(100|600|700)$', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', {code: '0', value: '^\\(FI-ASTERI-N\\)'}, '0'] // Subfield sort order after modify
        },
        {
          removeSubfields: {tag: '^(100|600|700)$', code: '0', value: '^\\d+$'}
        }
      ]
    }
  ]
};


// Find sources from sru by id
export const testEpic2 = {
  sourceRecordHarvestConfig: {
    type: 'sru',
    list: ['000015523'],
    queryFormat: 'rec.id=%s',
    url: 'https://sru.api.melinda-test.kansalliskirjasto.fi/bib',
    offset: 0
  },
  sourceRecordValidationFilters: {
    fieldsPresent: ['100$'],
    subfieldExclusion: [{tag: '100$', subfields: [{code: 't'}]}],
    fieldStructure: [{tag: '040$', subfields: {'d': {pattern: '(?:FI-NLD)$'}}}]
  },
  linkDataHarvesterConfig: [baseSruAutHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '100', value: 'collect'}
      },
      fieldsPresent: ['^(100|600|700)$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From source record
          to: {
            tag: '^(100|600|700)$', value: {code: '0'}, format: `(FI-ASTERI-N)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '^(100|600|700)$', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    }
  ]
};

// Harvest sources from file
export const testEpic3 = {
  sourceRecordHarvestConfig: {
    type: 'file',
    location: 'mallitietueet/test.json'
  },
  sourceRecordValidationFilters: {
    fieldsPresent: ['100$'],
    subfieldExclusion: [{tag: '100$', subfields: [{code: 't'}]}],
    fieldStructure: [{tag: '040$', subfields: {'d': {pattern: '(?:FI-NLD)$'}}}]
  },
  linkDataHarvesterConfig: [baseSruAutHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '100', value: 'collect'}
      },
      fieldsPresent: ['100$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '100$', subfields: [{code: '0'}]}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From source record
          to: {
            tag: '100', value: {code: '0'}, format: `(FI-ASTERI-N)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '100', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '600', value: 'collect'}
      },
      fieldsPresent: ['600$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '600$', subfields: [{code: '0'}]}],
      changes: [
        {

          from: {tag: '001', value: 'value'}, // From source record
          to: {
            tag: '600', value: {code: '0'}, format: `(FI-ASTERI-N)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '600', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '700', value: 'collect'}
      },
      fieldsPresent: ['700$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '700$', subfields: [{code: '0'}]}],
      changes: [
        {

          from: {tag: '001', value: 'value'}, // From source record
          to: {
            tag: '700', value: {code: '0'}, format: `(FI-ASTERI-N)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '700', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    }
  ]
};

// Find YSOs
export const testEpic1 = {
  sourceRecordHarvestConfig: baseOaiPmhBibSourceRecordHarvestConfig,
  sourceRecordValidationFilters: {
    fieldStructure: [{tag: '650$', subfields: {'2': {pattern: '(?:yso/)'}}}]
  },
  linkDataHarvesterConfig: [baseFintoHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      changes: [
        {
          add: {tag: '650', ind1: ' ', ind2: '7', subfields: [{code: 'a', value: '%s'}, {code: '2', value: 'yso/%s'}, {code: '0', value: 'http://www.yso.fi/onto/yso/%s'}]}, // To result record
          order: ['a', '2', '0'],
          duplicateFilterCodes: ['2', '0']
        }
      ]
    }
  ]
};
