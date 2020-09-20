var express = require('express')
var router = express.Router()
const { request, gql } = require('graphql-request')

// const { Pool, Client } = require('pg')
const { queryForData } = require('./queryGraphQL')
// const pool = new Pool({
//   connectionString: process.env.POSTGRES_URL,
// })

const APP_VERSION = 'v1'

/* Gets the schema from a GraphQL*/
async function getGraphQLTableSchema(resource_id) {
  // console.log("ResourceID: " + resource_id)

  const queryForSchema = gql`
  {
    __type(name: "${resource_id}") {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
`
  // return request(`${process.env.HASURA_URL}/v1/graphql`, queryForSchema)
  try {
    const schemaPrep = await request(
      `${process.env.HASURA_URL}/v1/graphql`,
      queryForSchema
    )
    //    console.log(JSON.stringify(schemaPrep, null, 2))  // TODO erase log
    schema = schemaPrep.__type
  } catch (e) {
    console.error(e)
    throw e
  }

  return schema
}

/* Creates a nice json from the GraphQL schema to return with the response to the end user */
function beautifyGQLSchema(gqlSchema) {
  return {
    name: gqlSchema.name,
    fields: gqlSchema.fields.map((f) => {
      return {
        name: f.name,
        type: f.type.name,
      }
    }),
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Home Page!!')
})

router.get(`/${APP_VERSION}/datastore_search/help`, function (req, res, next) {
  res.send('TODO this is the API help') //TODO help
})

/* GET . */
router.get(`/${APP_VERSION}/datastore_search`, async function (req, res, next) {
  try {

    if (!('resource_id' in req.query)) {
      res.redirect(`/${APP_VERSION}/datastore_search/help`)
    }
    // console.log("Request: " + JSON.stringify(req))
    // console.log("Query: " + JSON.stringify(req.query))
    // console.log("Params: " + JSON.stringify(req.params))
    // console.log("Headers: " + JSON.stringify(req.headers))
    const table = req.query.resource_id
    // query for schema  -> this should be already in Frictionless format
    // const schema = await queryForSchema()
    const schema = await getGraphQLTableSchema(table)

    // query for data -> basically the call to queryGraphQL
    const data = await queryForData(schema, req.query)

    /*TODO*/
    /* Auth handling  ... maybe JWT? */
    // Mandatory GET parameters check

    // response
    res.send({
      schema: beautifyGQLSchema(schema),
      data: data[table],
    })
  } catch (e) {
    console.error(e)
  }
})


// /* GET . */
// router.get(`/${APP_VERSION}/datastore_search`, async function (req, res, next) {
//   try {
//     // query for schema  -> TODO this should be already in Frictionless format
//     const schema = await queryForSchema()

//     // query for data -> basically the call to queryGraphQL
//     const data = await queryForData(schema, params)

//     //

//     /*TODO*/
//     /* Auth handling  ... maybe JWT? */
//     // Mandatory GET parameters check
//     if (!('resource_id' in req.query)) {
//       res.redirect(`/${APP_VERSION}/datastore_search/help`)
//     }
//     const table = req.query.resource_id

//     let gqlSchema = await getGraphQLTableSchema(table)
//     // console.log("GQL Schema : " + JSON.stringify(gqlSchema))
//     let tableFields = getFieldsFromGQLSchema(gqlSchema)
//     // console.log("Table Fields: "+tableFields)
//     // console.log("BeautyFields: " + JSON.stringify(beautifyGQLSchema(gqlSchema)))
//     //Query generation
//     let queryForData = createQuery(table, tableFields)
//     // console.log("Constructed query if NOT q = " + queryForData)
//     if ('q' in req.query) {
//       // console.log("entering q ... ")
//       queryForData = q2gql(
//         req.query.q,
//         schema,
//         table,
//         tableFields,
//         process.env.DEFAULT_ROW_LIMIT
//       )
//     }
//     //    console.log("Constructed query = " + queryForData)
//     // call HASURA service
//     const resData = await request(
//       `${process.env.HASURA_URL}/v1/graphql`,
//       queryForData
//     )
//     // const resData = await request(`${process.env.HASURA_URL}/v1/graphql`, queryForData, {table: table})
//     //    console.log(JSON.stringify(resData))
//     // response
//     res.send({
//       schema: beautifyGQLSchema(gqlSchema),
//       data: resData[table],
//     })
//   } catch (e) {
//     console.error(e)
//   }
// })

module.exports = router
