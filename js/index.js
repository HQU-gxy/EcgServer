"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const ws_1 = __importDefault(require("ws"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const serialport_1 = __importDefault(require("serialport"));
// Modify the SerialPort path to your Bluetooth adaptor
const serialPort = new serialport_1.default("COM15", {
    baudRate: 115200
});
const readLineParser = new serialport_1.default.parsers.Readline({
    delimiter: "\r\n",
});
serialPort.pipe(readLineParser);
readLineParser.on('data', (data) => {
    // console.log(data)
    heartRateSessionGroup.broadcastGroup(data);
});
const httpHeartRate = http_1.default.createServer();
const wssHeartRate = new ws_1.default.Server({
    server: httpHeartRate
});
const PORT = 3000;
const PORT_HEART = 3001;
const app = express_1.default();
const httpServer = http_1.default.createServer();
httpServer.on('request', app);
const wss = new ws_1.default.Server({
    server: httpServer
});
const STATIC_PATH = path_1.default.join(__dirname + 'static');
//express config
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.text());
app.use(express_1.default.static('static'));
app.use('/js', express_1.default.static('js'));
//only for debug
app.use('/src', express_1.default.static('src'));
// app.use(express.static(__dirname + '/static')); //Serve
class Data {
    constructor(ecg, temp, motion_x, motion_y, motion_z, time_stamp) {
        this.ecg = ecg;
        this.temp = temp;
        this.motion_x = motion_x;
        this.motion_y = motion_y;
        this.motion_z = motion_z;
        this.time_stamp = time_stamp;
    }
}
class DataArray {
    // Raw:Data[]=[]
    // Ecg:number[]=[]
    // Temperature: number[]=[]
    // Motion_x:number[]=[]
    // Motion_y:number[]=[]
    // Motion_z:number[]=[]
    Add(rawData, callback) {
        // this.Raw.push(rawData)
        // this.Ecg.concat(rawData.Ecg)
        // this.Temperature.concat(rawData.Temperature)
        // this.Motion_x.concat(rawData.Motion_x)
        // this.Motion_y.concat(rawData.Motion_y)
        // this.Motion_z.concat(rawData.Motion_z)
        callback(rawData);
    }
}
class WsSessionGroup {
    constructor() {
        // id?: string
        this.wsSessions = [];
    }
    broadcastGroup(message) {
        // const targetGroup = this.wsSessionGroupMap[groupName]
        this.wsSessions.forEach((session) => {
            if (session.readyState === ws_1.default.OPEN) {
                session.send(message);
            }
        });
        console.log(message);
    }
    addSession(session) {
        this.wsSessions.push(session);
        console.log("session started");
    }
    deleteSession(session) {
        const sessionList = this.wsSessions;
        sessionList.splice(sessionList.indexOf(session), 1);
        console.log("session ended");
    }
}
const sessionGroup = new WsSessionGroup;
const heartRateSessionGroup = new WsSessionGroup;
const dataArray = new DataArray;
//Websocket function
wss.on('connection', (ws) => {
    sessionGroup.addSession(ws);
    ws.on('close', () => {
        sessionGroup.deleteSession(ws);
    });
});
wssHeartRate.on('connection', (ws) => {
    heartRateSessionGroup.addSession(ws);
    ws.on('close', () => {
        heartRateSessionGroup.deleteSession(ws);
    });
});
app.post('/data', (req, res) => {
    const bodyParsed = req.body;
    // console.log(bodyParsed)
    const dataElement = new Data(bodyParsed.ecg, bodyParsed.temp, bodyParsed.motion_x, bodyParsed.motion_y, bodyParsed.motion_z, bodyParsed.time_stamp);
    dataArray.Add(dataElement, (rawData) => {
        sessionGroup.broadcastGroup(JSON.stringify(rawData));
    });
    res.sendStatus(200);
});
httpServer.listen(PORT, () => {
    console.log(`Main Server Listening ${PORT}`);
});
httpHeartRate.listen(PORT_HEART, () => {
    console.log(`Heart Rate Monitor Listening ${PORT_HEART}`);
});
//# sourceMappingURL=index.js.map