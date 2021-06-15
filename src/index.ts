import express from 'express'
import bodyParser from 'body-parser'
import WebSocket from 'ws'
import http from 'http'
import path from 'path'
import SerialPort from 'serialport'

// Modify the SerialPort path to your Bluetooth adaptor
const serialPort = new SerialPort("COM15", {
  baudRate:115200
})

const readLineParser=new SerialPort.parsers.Readline({
  delimiter:"\r\n",
})
serialPort.pipe(readLineParser)
readLineParser.on('data', (data) => {
  // console.log(data)
  heartRateSessionGroup.broadcastGroup(data)
})


const httpHeartRate=http.createServer()
const wssHeartRate = new WebSocket.Server({
  server: httpHeartRate
})




const PORT =  3000
const PORT_HEART =  3001
const app = express()
const httpServer = http.createServer()
httpServer.on('request', app)
const wss = new WebSocket.Server({
  server:httpServer
})
const STATIC_PATH=path.join(__dirname+'static')


//express config
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(bodyParser.text());
app.use(express.static('static'));
app.use('/js',express.static('js'))
//only for debug
app.use('/src',express.static('src'))
// app.use(express.static(__dirname + '/static')); //Serve

class Data{
  ecg:number[]
  temp: number[]
  motion_x:number[]
  motion_y:number[]
  motion_z:number[]
  time_stamp:number
  heart_rate:number
  constructor(ecg: number[], temp: number[], motion_x: number[], motion_y: number[], motion_z: number[], time_stamp: number) {
    this.ecg = ecg
    this.temp = temp
    this.motion_x = motion_x
    this.motion_y = motion_y
    this.motion_z = motion_z
    this.time_stamp=time_stamp
  }
}

class DataArray{
  // Raw:Data[]=[]
  // Ecg:number[]=[]
  // Temperature: number[]=[]
  // Motion_x:number[]=[]
  // Motion_y:number[]=[]
  // Motion_z:number[]=[]
  Add(rawData:Data,callback:(rawData:Data)=>void) {
    // this.Raw.push(rawData)
    // this.Ecg.concat(rawData.Ecg)
    // this.Temperature.concat(rawData.Temperature)
    // this.Motion_x.concat(rawData.Motion_x)
    // this.Motion_y.concat(rawData.Motion_y)
    // this.Motion_z.concat(rawData.Motion_z)
    callback(rawData)
  }
}

interface IWsSessionGroup{
  id?: string
  // name?:string
  wsSessions: WebSocket[]
  //Or use a map with uuid
  //wsSessions:Record<string,WebSocket>
}

class WsSessionGroup implements IWsSessionGroup{
  // id?: string
  wsSessions: WebSocket[] =[]
  broadcastGroup(message: WebSocket.Data):void {
    // const targetGroup = this.wsSessionGroupMap[groupName]
    this.wsSessions.forEach((session) => {
      if (session.readyState === WebSocket.OPEN) {
        session.send(message)
      }
    })
    console.log(message)
  }
  addSession(session:WebSocket) {
    this.wsSessions.push(session)
    console.log("session started")
  }
  deleteSession(session:WebSocket) {
    const sessionList = this.wsSessions
    sessionList.splice(sessionList.indexOf(session), 1)
    console.log("session ended")
  }
}

const sessionGroup=new WsSessionGroup
const heartRateSessionGroup=new WsSessionGroup
const dataArray=new DataArray

//Websocket function
wss.on('connection', (ws) => {
  sessionGroup.addSession(ws)
  ws.on('close', () => {
    sessionGroup.deleteSession(ws)
  })
})
wssHeartRate.on('connection', (ws) => {
  heartRateSessionGroup.addSession(ws)
  ws.on('close', () => {
    heartRateSessionGroup.deleteSession(ws)
  })
})

app.post('/data', (req, res) => {
  const bodyParsed=req.body
  // console.log(bodyParsed)
  const dataElement = new Data(bodyParsed.ecg, bodyParsed.temp, bodyParsed.motion_x, bodyParsed.motion_y, bodyParsed.motion_z, bodyParsed.time_stamp)
  dataArray.Add(dataElement, (rawData) => {
    sessionGroup.broadcastGroup(JSON.stringify(rawData))
  })
  res.sendStatus(200)
})

httpServer.listen(PORT, () => {
  console.log(`Main Server Listening ${PORT}`)
})
httpHeartRate.listen(PORT_HEART, () => {
  console.log(`Heart Rate Monitor Listening ${PORT_HEART}`)
})