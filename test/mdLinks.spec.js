import mdLinks from '../src/mdLinks'
import fetchMock from './__mocks__/node-fetch'

describe('mdLinks::', () => {
  fetchMock
    .mock('begin:https://markdown-with-broken-links.com/', 404)
    .mock('*', 200)

  describe('data::', () => {
    it('should return a exception when path  does not exist', async () =>
      await expect(mdLinks('./test/data/doesnotexist.md')).rejects.toThrow())

    it('should return all links', async () => {
      const markdownLinks = await mdLinks('./test/data/README.md')

      expect(markdownLinks.data()).toHaveLength(51)
    })

    it('should return all links with status and statusCode properties when validate option is provided', async () => {
      const markdownLinks = await mdLinks('./test/data/README.md', {
        validate: true
      })
      expect(markdownLinks.data()[0]).toHaveProperty('status')
      expect(markdownLinks.data()[0]).toHaveProperty('statusCode')
    })
  })

  describe('stats', () => {
    it('should return total links with unique links', async () => {
      const markdownLinks = await mdLinks('./test/data/README.md')
      expect(markdownLinks.stats()).toEqual({ total: 51, unique: 40 })
    })

    it('should return number of broken links when validate option is provided', async () => {
      const markdownLinks = await mdLinks(
        './test/data/README-WITH-BROKEN-LINKS.md',
        {
          validate: true
        }
      )
      expect(markdownLinks.stats()).toHaveProperty('broken', 3)
    })
  })
})
