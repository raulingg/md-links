import {
  absPath,
  validateUrl,
  streamFile,
  findMarkdownFiles,
  matchMarkdownLinks,
  uniqueBy
} from './util'

/**
 * @typedef {Object} Link
 * @property {String} path - Path to file where link was found
 * @property {String} href - URL to website
 * @property {String} text - Text descriptive used to attach url
 * @property {String|undefined} status - Confirm wether href is valid or not. "Ok" | "fail"
 * @property {number|undefined} statusCode - status code from server response when href is validated
 */

/**
 * @typedef {Object} Stats
 * @property {number} total - number of links found
 * @property {number} unique - number of links with href unique
 * @property {number|undefined} broken - number of links with status "fail"
 */

const onlyBroken = markdownLinks => markdownLinks.filter(item => item.status !== 'OK')

const stats = (markdownLinks, validate = false) => {
  const stats = {
    total: markdownLinks.length,
    unique: uniqueBy(markdownLinks, 'href').length
  }

  if (validate) {
    stats.broken = onlyBroken(markdownLinks).length
  }

  return stats
}

const pipe = (path, validate) => text => {
  const links = matchMarkdownLinks(text)

  return links.map(link => {
    const linkWithPath = { ...link, path }

    if (validate) {
      return validateUrl(linkWithPath.href)
        .then(statusData => ({
          ...linkWithPath,
          ...statusData
        }))
        .then(linkWithStatusData => {
          console.info(
            `${linkWithStatusData.path}  ${linkWithStatusData.href}  ${
              linkWithStatusData.status
            }  ${linkWithStatusData.statusCode}  ${linkWithStatusData.text}`
          )

          return linkWithStatusData
        })
    }

    console.info(`${linkWithPath.path}  ${linkWithPath.href}  ${linkWithPath.text}`)
    return Promise.resolve(linkWithPath)
  })
}

/**
 * mdLinks find links either in markdown file or in all files inside a directory
 * @param {String} path - Path to file or directory which contains markdown files
 * @param {Object} options  - Options that can be passed
 * @param {boolean} options.validate - if it's true it validate all links
 * @returns {Promise<{data: () => Link[] ,stats: () => Stats}, Error>}
 * @example
 * mdLinks('path/to/directory').then(mdlink => {
 *  const results = mdlink.data()
 *  const stats = mdlink.stats()
 * })
 */
module.exports = (path, options = { validate: false }) => {
  try {
    const absolutePath = absPath(path)
    const markdownPaths = findMarkdownFiles(absolutePath)
    const streamResultsPromised = markdownPaths.map(path =>
      streamFile(
        path,
        pipe(
          path,
          options.validate
        )
      )
    )

    return Promise.all(streamResultsPromised)
      .then(streamResults =>
        Promise.all(streamResults.reduce((acc, linkPromised) => acc.concat(linkPromised), []))
      )
      .then(links => ({
        data: () => links,
        stats: () => stats(links, options.validate)
      }))
  } catch (err) {
    return Promise.reject(err)
  }
}
