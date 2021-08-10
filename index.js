var WebSocketClient = require('websocket').client;
const { v4: uuidv4 } = require('uuid')

const wsEndpoint = 'ws://localhost:4000/socket/websocket'
const liveStreamId = 'GeEk8y'

const results = {}
const users = 1000
let curr = 0
let success = 0
let failure = 0

const report = () => {
  if (curr === users) {
    console.log('===== RESULTS =====')
    console.log(`SUCCESS: ${success}`)
    console.log(`FAILURE: ${failure}`)
    console.log(results)
    console.log('===================')
  }
}

const constructUrl = () => `${wsEndpoint}?guest_id=${uuidv4()}`

const connectToLiveStreamChannel = () => {
  const client = new WebSocketClient()
  client.on('connect', (connection) => {
      success++

      connection.on('error', (error) => {
        console.log("Connection Error: " + error.toString())
      })
      connection.on('close', function() {
        // console.log('Connection Closed')
      })
      connection.on('message', (message) => {
        if (message.type === 'utf8') {
          const json = JSON.parse(message.utf8Data)
          if (json.event === "join_batch") {
            const count = json.payload.recent_join
            results[json.payload.id] = count
            report()
          }
        }
      })
  
      connection.send(JSON.stringify({
        topic: `live_stream:${liveStreamId}`,
        ref: 1, 
        payload: {"username": ""},
        event: "phx_join"
      }))
  })
  client.on('connectFailed', (error) => {
    failure++
  })
  
  client.connect(constructUrl());
}

for (i = 0; i < users; i++) {
  connectToLiveStreamChannel()
  curr++
}
