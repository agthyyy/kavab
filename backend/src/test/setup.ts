import * as fc from 'fast-check';

// Configure fast-check globally: minimum 100 runs per property test
fc.configureGlobal({ numRuns: 100 });

// Set test environment
process.env['NODE_ENV'] = 'test';
