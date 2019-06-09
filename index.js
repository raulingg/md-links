const { resolve, isAbsolute, join } = require('path')
const fs = require('fs')
const fetch = require('node-fetch')

const markdownExtensions = ['md', 'markdown']

const convertToAbsolutePath = path => {
  if (!path) {
    throw new Error(`path was not provided`)
  }

  if (typeof path !== 'string') {
    throw new Error(`path must be a string type`)
  }

  return isAbsolute(path) ? path : resolve(path)
}

const walk = path => {
  const absolutePath = convertToAbsolutePath(path)

  try {
    return fs.statSync(absolutePath).isDirectory()
      ? fs
          .readdirSync(absolutePath)
          .reduce((ac, item) => ac.concat(walk(join(absolutePath, item))), [])
      : isMarkdownFile(absolutePath)
      ? [absolutePath]
      : []
  } catch (err) {
    throw new Error('path provided not found', err.message || err)
  }
}

const isMarkdownFile = filePath => {
  var extension = filePath.substr(filePath.lastIndexOf('.') + 1)
  return markdownExtensions.includes(extension)
}

const matchMarkdownLinks = text => {
  let m
  const regex = /\[([^\[\]]*?)\]\((https?:\/\/[^\s$.?#].[^\s]*)\)/g
  const matches = []

  while ((m = regex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    matches.push({ text: m[1], href: m[2] })
  }

  return matches
}

const validateLink = async object => {
  let statusCode, status

  try {
    const response = await fetch(object.href)
    statusCode = response.status
    status = response.statusText
  } catch (err) {
    statusCode = 500
    status = 'fail'
  }

  return { ...object, statusCode, status }
}

const readFileStream = (file, cb) =>
  new Promise((resolve, reject) =>
    fs
      .createReadStream(file, { encoding: 'utf8', highWaterMark: 16 * 1024 })
      .on('data', cb)
      .on('close', () => {
        resolve()
      })
      .on('error', function(err) {
        reject(err)
      })
  )

const uniqueBy = (arr, prop) =>
  arr.reduce((acc, item) => {
    if (!acc.includes(item[prop])) {
      acc.push(item[prop])
    }
    return acc
  }, [])

const onlyBroken = markdownLinks => markdownLinks.filter(item =>  item.status !== 'OK')

const stats = (markdownLinks, options = {validate : false}) => {
  const stats = {
    total: markdownLinks.length,
    unique: uniqueBy(markdownLinks, 'href').length
  }

  if (options.validate) {
    stats.broken = onlyBroken(markdownLinks).length
  }

  return stats
}

const validate =  markdownLinks => Promise.all(markdownLinks.map(validateLink))


const mdLinks = async (path, options = { validate: false, stats: false}) => {
  try {
    const absolutePath = convertToAbsolutePath(path)
    const markdownPaths = walk(absolutePath)

    let markdownLinks = []
    const markdownObjectsPromises = markdownPaths.map(path =>
      readFileStream(
        path,
        chunk =>
          (markdownLinks = markdownLinks.concat(matchMarkdownLinks(chunk)))
      )
    )
    await Promise.all(markdownObjectsPromises)

    if (options.validate) {
      markdownLinks = await validate(markdownLinks)
    }

    return Promise.resolve({
      data: () => markdownLinks,
      validate: () => validate(markdownLinks),
      stats: () => stats(markdownLinks, options)
    })
  } catch (err) {
    throw Promise.reject(err)
  }
}

module.exports = {
  convertToAbsolutePath,
  walk,
  matchMarkdownLinks,
  readFileStream,
  mdLinks
}
