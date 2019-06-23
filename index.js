const mdLinks = require('./dist/mdLinks').default

const path = './README.md'

mdLinks(path).then((links) => {
  links.data().map((link) => console.log(`${link.path} ${link.href}`))
  const stats = links.stats()
  console.log(`Total : ${stats.total}`)
  console.log(`Unique : ${stats.unique}`)
})
