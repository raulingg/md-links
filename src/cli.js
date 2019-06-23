#!/usr/bin/env node
import yargs from 'yargs'
import mdLinks from './mdLinks'

const start = new Date()
const args = yargs.argv

const options = {
  validate: Boolean(args.validate),
  stats: Boolean(args.stats)
}

mdLinks(args._[0], options).then(mdLink => {
  if (options.stats) {
    const stats = mdLink.stats()
    console.info('**********   Stats   **********')
    console.info('  Total: ', stats.total)
    console.info('  Unique: ', stats.unique)
    if (options.validate) console.info('  Broken: ', stats.broken)
    console.info('*******************************')
  }
  // calc execution time
  console.info('Execution time: %dms', new Date() - start)
})
