const convertToAbsolutePath = require('../').convertToAbsolutePath
const walk = require('../').walk
const matchMarkdownLinks = require('../').matchMarkdownLinks
// const hitLink = require('../').hitLink
const readFileStream = require('../').readFileStream
const mdLinks = require('../').mdLinks

describe('MarkdownLinks', () => {
  const basename = __dirname

  describe('absolute path', () => {
    it('should return exception when path is not present', () => {
      expect(() => convertToAbsolutePath()).toThrow()
    })

    it('should return exception when path is not a string', () => {
      expect(() => convertToAbsolutePath(2)).toThrow()
    })

    it('should return exception when path is a empty string', () => {
      expect(() => convertToAbsolutePath('')).toThrow()
    })

    it('should convert a relative path into absolute path', () => {
      const path = 'test/data/first-depth/file.md'
      const absolutePath = basename + '/data/first-depth/file.md'
      expect(convertToAbsolutePath(path)).toBe(absolutePath)
    })

    it('should return absolute path when given path is absolute', () => {
      const path = basename + '/data/first-depth/file.md'
      expect(convertToAbsolutePath(path)).toBe(path)
    })

    it('should convert relative path with ./ into absolute path', () => {
      const path = './test/data/first-depth/file.md'
      const absolutePath = basename + '/data/first-depth/file.md'
      expect(convertToAbsolutePath(path)).toBe(absolutePath)
    })

    it('should convert relative path with ../ into absolute path', () => {
      const path = 'test/data/first-depth/../another/file.md'
      const absolutePath = basename + '/data/another/file.md'
      expect(convertToAbsolutePath(path)).toBe(absolutePath)
    })
  })

  describe('find markdown files', () => {
    it('should return an array with all the paths of the markdown files found', () =>
      expect(walk('test/data/first-depth')).toEqual(
        expect.arrayContaining([
          basename + '/data/first-depth/file.md',
          basename + '/data/first-depth/file1.md',
          basename + '/data/first-depth/file2.md',
          basename + '/data/first-depth/second-depth/file.md',
          basename + '/data/first-depth/second-depth/third-depth/file.md',
          basename + '/data/first-depth/second-depth-sibling/file.md'
        ])
      ))

    it('should only return an array of markdown files paths excluding other file types', () =>
      expect(walk('test/data/another')).toHaveLength(2))

    it('should return an array empty when the given path does not have any file inside', () =>
      expect(walk('test/data/empty')).toEqual([]))

    it('should return an array with only one element when the given path is a markdown file', () =>
      expect(walk('test/data/first-depth/file.md')).toHaveLength(1))

    it('should return an exception when the given path does not exist', () =>
      expect(() => walk('another/not-present.md')).toThrow())
  })

  describe('match markdown links', () => {
    it('should return an array of objects', () => {
      const matches = matchMarkdownLinks('[text](https://google.com.pe)')
      expect(Array.isArray(matches)).toBeTruthy()
    })

    it('should return an empty array when the text does not have any link', () =>
      expect(matchMarkdownLinks('without links')).toHaveLength(0))

    it('should return only one link when the text passed has one link ', () =>
      expect(matchMarkdownLinks('[text](https://google.com.pe)')).toHaveLength(
        1
      ))

    it('should return an array of objects with text and link of each match', () =>
      expect(
        matchMarkdownLinks('[link to google](https://google.com.pe)')
      ).toContainEqual({
        text: 'link to google',
        href: 'https://google.com.pe'
      }))

    it('should return all the links in text', () => {
      const fs = require('fs')
      const text = fs.readFileSync(__dirname + '/data/markdown-example.md')

      expect(matchMarkdownLinks(text)).toHaveLength(5)
    })
  })

  // describe('Hit link', () => {
  //   it('should return status code 200', async (done) => {
  //     const statusCode = await hitLink('https://github.com/')
  //     expect(statusCode).toBe(200)
  //     done()
  //   })
  // })

  describe('read file streams', () => {
    it('should return only one chunk when file size is less than 16 KB', async done => {
      let chunksNumber = 0
      const callback = chunk => chunksNumber++
      await readFileStream(__dirname + '/data/markdown-example.md', callback)
      expect(chunksNumber).toBe(1)
      done()
    })

    it('should return 64 chunks when file size is 1 mb', async done => {
      let chunksNumber = 0
      const callback = chunk => chunksNumber++
      await readFileStream(__dirname + '/data/1mb.md', callback)
      expect(chunksNumber).toBe(64)
      done()
    })

    it('should not return any stream when the file is empty', async done => {
      let chunksNumber = 0
      const callback = chunk => chunksNumber++
      await readFileStream(__dirname + '/data/empty.md', callback)
      expect(chunksNumber).toBe(0)
      done()
    })

    it('should return an exception when the file is not found', async () => {
      await expect(
        readFileStream(__dirname + '/data/path/to/without-destiny.md', () => {})
      ).rejects.toThrow()
    })
  })

  describe('mdLinks function', () => {
    jest.setTimeout(30000)

    it('should return all links', async done => {
      const markdownLinks = await mdLinks('./test/data/README.md')
      expect(markdownLinks.data()).toHaveLength(51)
      done()
    })

    it('should return all links with info about status when validate option is provided', async done => {
      const markdownLinks = await mdLinks('./test/data/README.md', { validate: true })
      const mdl = markdownLinks.data()[0]
      expect(mdl).toHaveProperty('status')
      expect(mdl).toHaveProperty('statusCode')
      done()
    })

    describe('stats', () => {
      it('should return 51 total and 46 unique', async done => {
        const markdownLinks = await mdLinks('./test/data/README.md')
        expect(markdownLinks.stats()).toEqual({ total: 51, unique: 40 })
        done()
      })

      it('should return stats with number of broken links when validate option is provided', async done => {
        const markdownLinks = await mdLinks('./test/data/README.md', { validate: true })
        expect(markdownLinks.stats()).toHaveProperty('broken')
        done()
      })
    })
  })
})
