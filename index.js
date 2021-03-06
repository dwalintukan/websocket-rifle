const WebSocketClient = require('websocket').client
const { v4: uuidv4 } = require('uuid')

// Config
const WS_ENDPOINT = 'wss://cluster-worker.sandbox.fireworktv.com/socket/websocket'
const LIVE_STREAM_ID = '95D10o'
const MAX_CONNECTIONS = 10000

// State
const results = {}
let curr = 0
let successCount = 0
let failureCount = 0

const onConnectFailed = (error) => {
  failureCount++
}

const onError = (error) => {
  console.log("Connection Error: " + error.toString())
}

const onClose = () => {
  // console.log('Connection Closed')
}

const onConnect = (connection) => {
  successCount++
  
  connection.on('error', (error) => onError(error))
  connection.on('close', () => onClose())
  connection.on('message', (message) => onMessage(message))

  connection.send(JSON.stringify({
    topic: `live_stream:${LIVE_STREAM_ID}`,
    ref: 1, 
    payload: {"username": ""},
    event: "phx_join"
  }))
}

const report = () => {
  if (curr === MAX_CONNECTIONS) {
    console.log('===== RESULTS =====')
    console.log(`SUCCESS: ${successCount}`)
    console.log(`FAILURE: ${failureCount}`)
    console.log(results)

    const total = Object.keys(results).reduce((acc, k) => acc + results[k], 0)
    console.log(`TOTAL: ${total}`)
  }
}

const onMessage = (message) => {
  if (message.type === 'utf8') {
    const json = JSON.parse(message.utf8Data)
    if (json.event === "join_batch") {
      const count = json.payload.batch_count
      results[json.payload.id] = count
      report()
    }
  }
}

const constructUrl = () => {
  const url = new URL(WS_ENDPOINT)
  url.search = `?guest_id=${uuidv4()}`
  return url.toString()
}

const connectToLiveStreamChannel = () => {
  const client = new WebSocketClient()
  client.on('connect', (connection) => onConnect(connection))
  client.on('connectFailed', (error) => onConnectFailed(error))
  client.connect(constructUrl())
  curr++
}

// Run
for (i = 0; i < MAX_CONNECTIONS; i++) {
  connectToLiveStreamChannel()
}
