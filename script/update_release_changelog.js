const getStdin = require('get-stdin')

const octokit = require('@octokit/rest')()
octokit.authenticate({type: 'token', token: process.env.GITHUB_TOKEN})

const foo = async () => {
  const str = await getStdin()

  const release = await octokit.repos.getReleaseByTag({
    owner: 'eshepelyuk', repo: 'asciidoctor-plantuml.js', tag: process.env.TRAVIS_TAG
  })

  await octokit.repos.editRelease({
    owner: 'eshepelyuk',
    repo: 'asciidoctor-plantuml.js',
    id: release.data.id,
    tag_name: release.data.tag_name,
    body: str
  })
}
foo()
