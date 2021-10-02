import {
  absPath,
  findMarkdownFiles,
  matchMarkdownLinks,
  streamFile,
  validateUrl
} from '../../src/util'
import path from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import fetchMock from '../__mocks__/node-fetch'

const getRandomNumber = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

describe('Utils::', () => {
  const dataDirPath = path.join(__dirname, '/../data')

  describe('convertAbsolutePath', () => {
    it('should return exception when path is not present', () => {
      expect(() => absPath()).toThrow()
    })

    it('should return exception when path is not a string', () => {
      expect(() => absPath(2)).toThrow()
    })

    it('should return exception when path is a empty string', () => {
      expect(() => absPath('')).toThrow()
    })

    it('should convert a relative path into absolute path', () => {
      const path = 'test/data/first-depth/file.md'
      const absolutePath = dataDirPath + '/first-depth/file.md'
      expect(absPath(path)).toBe(absolutePath)
    })

    it('should return absolute path when given path is absolute', () => {
      const path = dataDirPath + '/first-depth/file.md'
      expect(absPath(path)).toBe(path)
    })

    it('should convert relative path with ./ into absolute path', () => {
      const path = './test/data/first-depth/file.md'
      const absolutePath = dataDirPath + '/first-depth/file.md'
      expect(absPath(path)).toBe(absolutePath)
    })

    it('should convert relative path with ../ into absolute path', () => {
      const path = 'test/data/first-depth/../another/file.md'
      const absolutePath = dataDirPath + '/another/file.md'
      expect(absPath(path)).toBe(absolutePath)
    })
  })

  describe('findMarkdownFiles::', () => {

    it('should return an error when path is missing', () =>
      expect(() => findMarkdownFiles()).toThrow()
    )

    it('should return an array with all the paths of the markdown files found', () =>
      expect(findMarkdownFiles(dataDirPath + '/first-depth')).toEqual(
        expect.arrayContaining([
          dataDirPath + '/first-depth/file.md',
          dataDirPath + '/first-depth/file1.md',
          dataDirPath + '/first-depth/file2.md',
          dataDirPath + '/first-depth/second-depth/file.md',
          dataDirPath + '/first-depth/second-depth/third-depth/file.md',
          dataDirPath + '/first-depth/second-depth-sibling/file.md'
        ])
      ))

    it('should only return an array of markdown files paths excluding other file types', () =>
      expect(findMarkdownFiles(dataDirPath + '/another')).toHaveLength(2))

    it('should return an array empty when the given path does not have any file inside', () => {
      const emptyDir = dataDirPath + '/empty-dir'

      if (!existsSync(emptyDir)) {
        mkdirSync(emptyDir)
      }

      expect(findMarkdownFiles(emptyDir)).toEqual([])
    })

    it('should return an array with only one element when the given path is a markdown file', () =>
      expect(
        findMarkdownFiles(dataDirPath + '/first-depth/file.md')
      ).toHaveLength(1))

    it('should return an exception when the given path does not exist', () =>
      expect(() =>
        findMarkdownFiles(dataDirPath + '/another/not-present.md')
      ).toThrow())
  })

  describe('matchMarkdownLinks::', () => {
    it('should return an array of objects', () => {
      const matches = matchMarkdownLinks('[text](https://google.com.pe)')
      expect(Array.isArray(matches)).toBeTruthy()
    })

    it('should return an empty array when a empty string is provided', () =>
      expect(matchMarkdownLinks('')).toHaveLength(0))

    it('should return an empty array when it does not find any link', () =>
      expect(matchMarkdownLinks('without links')).toHaveLength(0))

    it('should return an array of objects with text and href of each match', () =>
      expect(
        matchMarkdownLinks('[link to google](https://google.com.pe)')
      ).toContainEqual({
        text: 'link to google',
        href: 'https://google.com.pe'
      }))

    it('should return all valid links', () => {
      const text = readFileSync(dataDirPath + '/markdown-example.md')
      expect(matchMarkdownLinks(text)).toHaveLength(5)
    })

    it('should return all valid links including video links', () => {
      const text = readFileSync(dataDirPath + '/README-WITH-VIDEO-LINKS.md')
      expect(matchMarkdownLinks(text)).toHaveLength(9)
    })
  })

  describe('streamFile::', () => {
    it('should return only one chunk when file size is less than 4 KB', async () => {
      let chunksNumber = 0
      const callback = () => chunksNumber++
      await streamFile(dataDirPath + '/markdown-example.md', callback)
      expect(chunksNumber).toBe(1)
    })

    it('should return 5 chunks', async () => {
      let chunksNumber = 0
      const callback = () => chunksNumber++
      await streamFile(dataDirPath + '/README.md', callback)
      expect(chunksNumber).toBe(5)
    })

    it('should not return any stream when the file is empty', async () => {
      let chunksNumber = 0
      const callback = () => chunksNumber++
      await streamFile(dataDirPath + '/empty.md', callback)
      expect(chunksNumber).toBe(0)
    })

    it('should return an exception when the file is not found', async () => {
      await expect(
        streamFile(dataDirPath + '/path/to/without-destiny.md', () => {})
      ).rejects.toThrow()
    })
  })

  describe('validateUrl', () => {
    beforeAll(() => {
      fetchMock.config.fallbackToNetwork = true
      fetchMock.config.warnOnFallback = false
    })

    afterEach(fetchMock.reset)

    it('should return statusCode', async () => {
      const statusCode = getRandomNumber(100, 598)
      fetchMock.mock('https://google.com', statusCode)
      const result = await validateUrl('https://google.com')
      expect(result).toHaveProperty('statusCode', statusCode)
    })

    it('should return status "fail" when statusCode < 200', async () => {
      const urlNotValid = 'https://urlNotValid.com'
      fetchMock.mock(urlNotValid, getRandomNumber(0, 199))
      const result = await validateUrl(urlNotValid)
      expect(result).toHaveProperty('status', 'fail')
    })

    it('should return status "fail" when the statusCode >= 300', async () => {
      const urlNotFound = 'https://urlnotfound.com'
      fetchMock.mock(urlNotFound, getRandomNumber(300, 598))
      const result = await validateUrl(urlNotFound)
      expect(result).toHaveProperty('status', 'fail')
    })

    it('should return status "OK" return  200 <=statusCode < 300', async () => {
      fetchMock.mock('https://google.com', getRandomNumber(200, 299))
      const result = await validateUrl('https://google.com')
      expect(result).toHaveProperty('status', 'OK')
    })

    it('should return status "fail" when a unexpected error happens', done =>
      validateUrl('urlException').then(result => {
        expect(result).toHaveProperty('status', 'fail')
        done()
      }))

    it('should return statusCode 500 when a unexpected error happens', done =>
      validateUrl('urlException').then(result => {
        expect(result).toHaveProperty('statusCode', 500)
        done()
      }))
  })
})
