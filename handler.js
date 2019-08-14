'use strict';

const BASE_URL = [
  "snapchat://add/",
  "https://www.snapchat.com/add/"
]
const HOME = "https://snaplink.app"
const ORIGIN = "https://s.nap.chat"
const SNAP = {}
const TABLE = "s.nap.chat"
const AWS = require("aws-sdk")
const dynamodb = new AWS.DynamoDB()

SNAP.utils = {
  String: {},
  Snapchat: {}
}

SNAP.utils.String.clean = (string) => {
  return string.toString().trim().toLowerCase().replace(/[^a-zA-Z0-9_\-]+/g, "")
}

SNAP.utils.String.isClean = (string) => {
  string = SNAP.utils.String.clean(string)
  if (!("_-").includes(string[0]) && string.length > 0) {
    return true
  }
  return false
}

SNAP.utils.Snapchat.clean = (string) => {
  return string.toString().trim().toLowerCase().replace(/[^a-zA-Z0-9\._\-]+/g, "")
}

SNAP.utils.Snapchat.isClean = (string) => {
  string = SNAP.utils.Snapchat.clean(string)
  if (!("._-").includes(string[0]) && string.length > 0) {
    return true
  }
  return false
}

SNAP.utils.error = (callback, origin) => {
  callback(null, {
    statusCode: 500,
    headers: {
      "Access-Control-Allow-Origin": origin,
    }
  })
}

module.exports.load = (event, context, callback) => {
  let URL = event.pathParameters.url
  if (URL) {
    URL = SNAP.utils.String.clean(URL)
    let params = {
      AttributesToGet: [
        "username"
      ],
      Key: {
        "url": {
          "S": URL
        }
      },
      TableName: TABLE
    }
    dynamodb.getItem(params, function(err, data) {
      if (!err) {
        let redirect = HOME
        let alternate = false
        let username = false
        if (data.Item) {
          let u = data.Item.username.S.toString().trim()
          if ((u !== "false" && u !== false) && u !== "reserved") {
            redirect = (BASE_URL[0] + u + "/")
            alternate = (BASE_URL[1] + u + "/")
            username = u
          }
        }
        callback(null, {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": ORIGIN,
          },
          body: JSON.stringify({
            method: "LOAD",
            location: redirect,
            alternate: alternate,
            username: username
          })
        })
      }
    })
  }
  else {
    SNAP.utils.error(callback, ORIGIN)
  }
}

module.exports.check = (event, context, callback) => {
  const URL = event.pathParameters.url
  if (URL) {
    if (SNAP.utils.String.isClean(URL)) {
      let params = {
        AttributesToGet: [
          "username"
        ],
        Key: {
          "url": {
            "S": URL
          }
        },
        TableName: TABLE
      }
      dynamodb.getItem(params, function(err, data) {
        if (!err) {
          let availability = true
          if (data.Item) {
            availability = false
          }
          callback(null, {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": HOME,
            },
            body: JSON.stringify({
              method: "CHECK",
              available: availability
            })
          })
        }
      })
    }
    else {
      SNAP.utils.error(callback, HOME)
    }
  }
  else {
    SNAP.utils.error(callback, HOME)
  }
}

module.exports.create = (event, context, callback) => {
  const URL = event.queryStringParameters.url
  const USERNAME = event.queryStringParameters.username
  if (URL && USERNAME) {
    if (SNAP.utils.String.isClean(URL) && SNAP.utils.Snapchat.isClean(USERNAME)) {
      let params = {
        AttributesToGet: [
          "username"
        ],
        Key: {
          "url": {
            "S": URL
          }
        },
        TableName: TABLE
      }
      dynamodb.getItem(params, function(err, data) {
        if (!err) {
          if (data.Item) {
            callback(null, {
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Origin": HOME,
              },
              body: JSON.stringify({
                method: "CREATE",
                success: false
              })
            })
          }
          else {
            params = {
              Item: {
                "url": {
                  S: URL
                },
                "username": {
                  S: USERNAME
                }
              },
              TableName: TABLE
            }
            dynamodb.putItem(params, function(err, data) {
              if (!err) {
                callback(null, {
                  statusCode: 200,
                  headers: {
                    "Access-Control-Allow-Origin": HOME,
                  },
                  body: JSON.stringify({
                    method: "CREATE",
                    success: true
                  })
                })
              }
            })
          }
        }
      })
    }
    else {
      SNAP.utils.error(callback, HOME)
    }
  }
  else {
    SNAP.utils.error(callback, HOME)
  }
}
