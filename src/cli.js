#!/usr/bin/env node
import minimist from 'minimist'
import mdLinks from './mdLinks'
import pkg from '../package'

const start = new Date()

const error = err => {
  console.error(err.errorInfo || err)
  console.error(`Try "${pkg.name} --help" to see available commands and options`)
  process.exit(1)
}

const help = () => `
Usage: ${pkg.name} path [options]

path:
  /path/to/dir        absolute path to a folder
  /path/to/file.md    absolute path to a file
  ./relative/file.md  relative path to a file
  relative/dir        relative path to a folder

Options:
  -val, --validate  Verify if links are broken
  -s, --stats       Show stats about markdown links found (total, unique) and
                    when validate option is provided along it's also gonna show number broken links
  -h, --help        Show help
  -v, --version     Show version
`

const { _: args, ...opts } = minimist(process.argv.slice(2))

if (opts.v || opts.version) {
  console.info(pkg.version)
  process.exit(0)
}

if (opts.h || opts.help) {
  console.info(help())
  process.exit(0)
}

const options = {
  validate: Boolean(opts.validate || opts.val),
  stats: Boolean(opts.stats || opts.s)
}

mdLinks(args[0], options)
  .then(mdLink => {
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
    process.exit(0)
  })
  .catch(error)
