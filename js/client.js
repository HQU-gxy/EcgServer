
class Data {
    constructor(temp, motion_x, motion_y, motion_z) {
        // this.ecg = ecg;
        this.temp = temp;
        this.motion_x = motion_x;
        this.motion_y = motion_y;
        this.motion_z = motion_z;
        // this.heart_rate=heart_rate;
        // this.time_stamp = time_stamp;
    }
}

function arrayAverage(arr){
    //Find the sum
    var sum = 0;
    for(var i in arr) {
        sum += arr[i];
    }
    //Get the length of the array
    var numbersCnt = arr.length;
    //Return the average / mean.
    return (sum / numbersCnt);
}

class DataArray {
    constructor() {
        this.Raw = [];
        this.Ecg = [];
        this.Temperature = [];
        this.Motion_x = [];
        this.Motion_y = [];
        this.Motion_z = [];
        this.TemperatureBuffer=[];
        this.MotionBuffer=new MotionArray(3100,10);
    }
    Add(rawData, callback) {
        this.Raw.push(rawData);
        // this.Ecg = this.Ecg.concat(rawData.ecg);
        if(this.TemperatureBuffer.length>10){
            this.TemperatureBuffer.length=0
        }
        this.TemperatureBuffer = this.TemperatureBuffer.concat(rawData.temp);
        if(this.TemperatureBuffer.length>1){
            this.AverageTemp= arrayAverage(this.TemperatureBuffer).toFixed(1)
            document.getElementById("tempAvg").textContent=this.AverageTemp
        }
        const motionObj=new MotionObj(rawData.motion_x[0],rawData.motion_y[0],rawData.motion_z[0],0,0,-16384)
        // console.log(motionObj)
        // console.log(Date.now())
        if(this.MotionBuffer.getLength()!=this.MotionBuffer.pedometerSampleLen){
            this.MotionBuffer.addMotionObj(motionObj)
        }else{
            const origStep=document.getElementById("pedo").textContent
            const newStep=parseInt(origStep)+this.MotionBuffer.getSteps()
            const distance=newStep*0.6
            const cal=newStep*0.02365
            document.getElementById("pedo").textContent=newStep
            document.getElementById("distance").textContent=(distance).toFixed(2)
            document.getElementById('cal').textContent=(cal).toFixed(3)
            this.MotionBuffer.clear()
        }
        callback(rawData)
    }
}

class MotionObj{
    constructor(input_x,input_y,input_z,offset_x,offset_y,offset_z){
        this.x=input_x+offset_x
        this.y=input_y+offset_y
        this.z=input_z+offset_z
    }
}
class MotionArray{
    constructor(threshold,len){
        this.content=[]
        this.pedometerThreshold=threshold
        this.pedometerSampleLen=len
        this.steps=0
    }
    getMeanX(){
        let sum=0
        for(let i=0;i<this.pedometerSampleLen;i++){
            sum+=this.content[i].x
        }
        return sum/this.pedometerSampleLen
    }
    getMeanY(){
        let sum=0
        for(let i=0;i<this.pedometerSampleLen;i++){
            sum+=this.content[i].y
        }
        return sum/this.pedometerSampleLen
    }
    getMeanZ(){
        let sum=0
        for(let i=0;i<this.pedometerSampleLen;i++){
            sum+=this.content[i].z
        }
        return sum/this.pedometerSampleLen
    }
    getAvgArr(){
        let vectorArr=[]
        let avgArr=[]
        const xAvg=this.getMeanX()
        const yAvg=this.getMeanY()
        const zAvg=this.getMeanZ()
        // print(xAvg)
        for(let i=0;i<this.pedometerSampleLen;i++){
            vectorArr[i]=Math.sqrt(Math.pow((this.content[i].x-xAvg),2)+Math.pow((this.content[i].y-yAvg),2)+Math.pow((this.content[i].z-zAvg),2))
        }
        return vectorArr
    }
    getSteps(){
        const avgArr=this.getAvgArr()
        // console.log(avgArr)
        let flag=false
        console.log(avgArr)
        for(let i=0;i<avgArr.length;i++){
            // console.log(avgArr[i]>this.pedometerThreshold && flag==false)
            if(avgArr[i]>this.pedometerThreshold && flag==false){
                this.steps++
                // console.log("step!")
                flag=true
            }else if(avgArr[i]>this.pedometerThreshold && flag==true){
                //do noting
                // console.log("nothing")
            }
            if(avgArr[i]<this.pedometerThreshold && flag==true){
                flag=false
                // console.log("false")
            }
        }
        return this.steps
    }
    addMotionObj(motionObj){
        this.content.push(motionObj)
    }
    clear(){
        this.content.length=0
        this.steps=0
    }
    getLength(){
        return this.content.length
    }
}

const dataArray = new DataArray;
const ip=location.host
const ipOnly=String(location.host).split(":")[0]
const heartRatePort=3001

// Activates knockout.js
let bmpArray=[]
// let Array=[]

const heartRateSocket = new WebSocket('ws://'.concat(ipOnly).concat(":").concat(heartRatePort));
console.log('ws://'.concat(ipOnly).concat(":").concat(heartRatePort))
const socket = new WebSocket('ws://'.concat(ip));
const ecgExportArray=[]
heartRateSocket.addEventListener('message',(eventData)=>{
    // drawTimeline(eventData.data,ecgDataSet,10)
    // console.log(eventData.data)
    dataString=String(eventData.data)
    let exportObj={
        ecgVal:"n",
        heartRate:"n",
    }
    if(dataString[0]=='B'){
        bmp=dataString.slice(1)
        document.getElementById("heart").textContent=bmp
        const numberBmp=Number(bmp)
        exportObj.heartRate=numberBmp
        if(numberBmp>105){
            document.getElementById("heart").style.color="red"
        }else if(numberBmp<50){
            document.getElementById("heart").style.color="blue"
        }else{
            document.getElementById("heart").style.color="black"
        }
        // console.log(bmp)
    }else{
        // performance.now()
        ecgDataSet.append(ecgCount,Number(dataString))
        ecgCount+=50
        exportObj.ecgVal=Number(dataString)
    }
    ecgExportArray.push(exportObj)
})
socket.addEventListener('message', (event) => {
    const parsed = JSON.parse(event.data);
    const parsedData = new Data(parsed.temp, parsed.motion_x, parsed.motion_y, parsed.motion_z);
    dataArray.Add(parsedData, (data) => {
        data.motion_z[0]-=16382
        // drawTimeline(data.ecg,ecgDataSet,10)
        drawTimeline(data.temp,tempDataSet,50)
        drawTimeline(data.motion_x,motionDataSetX,50)
        drawTimeline(data.motion_y,motionDataSetY,50)
        drawTimeline(data.motion_z,motionDataSetZ,50)
        // if(data.heart_rate>0){
        //     document.getElementById('heart_rate')=data.heart_rate
        // }
    })
    // console.log(dataArray.Temperature)
})

let ecgCount=0
const ecgChart = new SmoothieChart({
    responsive: true,
    tooltip:true,
    nonRealtimeData:true,
    interpolation:'linear'
});
const ecgDataSet=new TimeSeries();
const tempChart = new SmoothieChart({responsive: true,tooltip:true});
const tempDataSet=new TimeSeries();
const motionChart = new SmoothieChart({responsive: true,tooltip:true});
const motionDataSetX=new TimeSeries();
const motionDataSetY=new TimeSeries();
const motionDataSetZ=new TimeSeries();


function init(){
    attachTimeline(ecgChart,ecgDataSet,"ecg")
    attachTimeline(tempChart,tempDataSet,"temp")
    attachTimelineThree(motionChart,motionDataSetX,motionDataSetY,motionDataSetZ,"motion")
}
function attachTimeline(smoothieChart,timeSeries,elementId) {
    // const smoothie = new SmoothieChart();
    smoothieChart.addTimeSeries(timeSeries);
    smoothieChart.streamTo(document.getElementById(elementId),100);
}
function attachTimelineThree(smoothieChart,timeSeriesX,timeSeriesY,timeSeriesZ,elementId) {
    // const smoothie = new SmoothieChart();
    smoothieChart.addTimeSeries(timeSeriesX,{
        strokeStyle: 'rgba(255, 0, 0, 1)',
        fillStyle: 'rgba(255, 0, 0, 0.1)'
    });
    smoothieChart.addTimeSeries(timeSeriesY,{
        strokeStyle: 'rgba(0, 255, 0, 1)',
        fillStyle: 'rgba(0, 255, 0, 0.1)'
    });
    smoothieChart.addTimeSeries(timeSeriesZ,{
        strokeStyle: 'rgba(0, 0, 255, 1)',
        fillStyle: 'rgba(0, 0, 255, 0.1)'
    });
    smoothieChart.streamTo(document.getElementById(elementId),500);
}
function openSaveFileDialog (data, filename, mimetype) {
    if (!data) return;

    var blob = data.constructor !== Blob
      ? new Blob([data], {type: mimetype || 'application/octet-stream'})
      : data ;

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
      return;
    }

    var lnk = document.createElement('a'),
        url = window.URL,
        objectURL;

    if (mimetype) {
      lnk.type = mimetype;
    }

    lnk.download = filename || 'untitled';
    lnk.href = objectURL = url.createObjectURL(blob);
    lnk.dispatchEvent(new MouseEvent('click'));
    setTimeout(url.revokeObjectURL.bind(url, objectURL));
}

function ecgExport(){
    const exportedCsvStr=Papa.unparse(ecgExportArray)
    openSaveFileDialog(exportedCsvStr,"ecg.csv","text/csv")
}

//number[], TimeSerials
function drawTimeline(array,timeSeries,samplePerSecond){
    time=Date.now()
    array.forEach(element => {
        time+=samplePerSecond
        // time+=1
        // let time=Date.now()
        // console.log(time)
        timeSeries.append(time,element)
    });
}