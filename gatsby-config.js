const baseConfig = {
  siteMetadata: {
    title: `Sparkpost Developers`,
    description: `SparkPost developer resources including Documentation, API reference, and client libraries.`,
  }
}

const basePlugins = [
  `gatsby-plugin-react-next`,
  `gatsby-plugin-netlify-cms`,
  `gatsby-plugin-react-helmet`,
  `gatsby-plugin-styled-components`,
  `gatsby-plugin-lodash`,
  /** Resolve files through webpack
   ** `../../utils/colors` becomes `utils/colors` */
  {
    resolve: `gatsby-plugin-root-import`,
    options: { root: `${__dirname}/src` }
  },
  /** Analytics
   ** Note: Google Analytics, HotJar, etc. is added through GTM */
  {
    resolve: `gatsby-plugin-google-tagmanager`,
    options: {
      id: 'GTM-WN7C84',
      includeInDevelopment: false,
    }
  },
]

const docsPlugins = [
  /** data sourcing */
  {
    resolve: `gatsby-source-filesystem`,
    options: {
      name: `content`,
      path: `${__dirname}/content/`,
    },
  },
  `gatsby-transformer-api-elements`
]

const contentPlugins = [
  `gatsby-transformer-json`,
  {
    resolve: `gatsby-plugin-page-creator`,
    options: {
      path: `${__dirname}/content/pages`,
    },
  },
  {
    resolve: `gatsby-source-wordpress`,
    options: {
      baseUrl: 'sparkpost.com',
      protocol: 'https',
      hostingWPCOM: false,
      useACF: false,
      excludedRoutes: [ '**/oembed/**', '**/akismet/**', '**/yoast/**' , '**/users/**', '**/settings', '**/pages', '**/yst_prominent_words', '**/comments', '**/statuses', '**/media' ]
    }
  },
  {
    resolve: 'gatsby-source-github',
    options: {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      queries: [
        `{
          search(type: REPOSITORY, query: "is:public user:SparkPost", first: 100) {
            edges {
              node {
                ... on Repository {
                  name
                  url
                  description
                  stargazers {
                    totalCount
                  }
                }
              }
            }
          }
        }`,
      ],
    }
  },
]

/** Plugins to analyze build - manually add to the plugins list below */
const analyzePlugins = [
  /**
   * Analyze webpack build
   */
  {
    resolve: 'gatsby-plugin-webpack-bundle-analyzer',
    options: {
        analyzerPort: 3000,
        production: true,
    },
  },
]

const plugins = process.env.NODE_ENV === 'docs' ? [
  ...basePlugins,
  ...docsPlugins,
] : [
  ...basePlugins,
  ...docsPlugins,
  ...contentPlugins
]

module.exports = { ...baseConfig, plugins }
