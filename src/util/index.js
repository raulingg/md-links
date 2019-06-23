import { resolve, isAbsolute, join } from 'path'
import fs from 'fs'
import fetch from 'node-fetch'

export const absPath = path => {
  if (!path) {
    throw new Error(`path was not provided`)
  }

  if (typeof path !== 'string') {
    throw new Error(`path must be a string type`)
  }

  return isAbsolute(path) ? path : resolve(path)
}

const isMarkdownFile = filePath => filePath.endsWith('.md') || filePath.endsWith('.markdown')

/**
 *
 * @param {path} path Absolute path
 * @returns array
 */
export const findMarkdownFiles = path => {
  try {
    return fs.statSync(path).isDirectory()
      ? fs
          .readdirSync(path)
          .reduce((ac, item) => ac.concat(findMarkdownFiles(join(path, item))), [])
      : isMarkdownFile(path)
      ? [path]
      : []
  } catch (err) {
    throw new Error('path provided not found', err.message || err)
  }
}

export const validateUrl = url =>
  fetch(url)
    .then(({ status, ok }) => ({
      status: ok ? 'OK' : 'fail',
      statusCode: status
    }))
    .catch(() => ({ status: 'fail', statusCode: 500 }))

export const streamFile = (path, cb) =>
  new Promise((resolve, reject) => {
    let promises = []
    const readable = fs.createReadStream(path, {
      encoding: 'utf8',
      highWaterMark: 4 * 1024
    })

    readable.on('data', chunk => {
      promises = promises.concat(cb(chunk.toString()))
    })
    readable.on('close', () => {
      resolve(promises)
    })

    readable.on('error', err => {
      reject(err)
    })
  })

export const matchMarkdownLinks = text => {
  let m
  const regex = /\[([^\[\]]*?)\]\((https?:\/\/[^\s$.?#].[^\s]*)\)/g
  const matches = []

  while ((m = regex.exec(text)) !== null) {
    if (m[2].includes(')](')) {
      const videoUrls = m[2].split(')](')
      matches.push({ text: m[1], href: videoUrls[0] }, { text: m[1], href: videoUrls[1] })
    } else {
      matches.push({ text: m[1], href: m[2] })
    }
  }

  return matches
}

export const uniqueBy = (arr, prop) =>
  arr.reduce((acc, item) => {
    if (item.hasOwnProperty(prop) && !acc.includes(item[prop])) {
      acc.push(item[prop])
    }
    return acc
  }, [])
