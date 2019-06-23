import {
  absPath,
  validateUrl,
  streamFile,
  findMarkdownFiles,
  matchMarkdownLinks,
  uniqueBy
} from './util'

const onlyBroken = markdownLinks =>
  markdownLinks.filter(item => item.status !== 'OK')

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
  const linksWithPath = links.map(link => ({ ...link, path }))

  if (validate) {
    return linksWithPath.map(link =>
      validateUrl(link.href).then(response => ({
        ...link,
        ...response
      }))
    )
  }

  return linksWithPath
}

export default async (path, options = { validate: false, stats: false }) => {
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

    const streamResults = await Promise.all(streamResultsPromised)
    const markdownLinks = await Promise.all(
      streamResults.reduce((acc, streamResult) => acc.concat(streamResult), [])
    )
    return {
      data: () => markdownLinks,
      stats: () => stats(markdownLinks, options.validate)
    }
  } catch (err) {
    return Promise.reject(err)
  }
}
