const request = require('supertest')
const app = require('../../app')

describe('GraphQL endpoint', function () {
  it('returns graphql schema', function (done) {
    request(app)
      .post('/v1/graphql')
      .send({
        query: '{\n\t__schema{\n queryType {\n fields{\n name\n }\n }\n }\n}',
      })
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        if (!res.text.includes('test_table')) {
          console.error(res.text)
          throw new Error('missing test_table in schema')
        }
        done()
      })
  })

  /*
  FIXME: the test fail right now, because hasura returns 200 status even
    when not found the requested resource (wraps the 404 response into 200
    response, see error-log.json (the relevant logs from hasura container)
    file for more details
   */
  it('should return 404 for non existing columns', function (done) {
    const query = `
      query MyQuery {
        test_table_aggregate {
          aggregate {
            absent_column
          }
        }
      }
    `

    request(app).post('/v1/graphql').send({ query }).expect(404, done)
  })
})
