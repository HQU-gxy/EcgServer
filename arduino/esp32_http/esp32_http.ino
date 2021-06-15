/**
 * BasicHTTPClient.ino
 *
 *  Created on: 24.05.2015
 *
 */
#if CONFIG_FREERTOS_UNICORE
#define ARDUINO_RUNNING_CORE 0
#else
#define ARDUINO_RUNNING_CORE 1
#endif

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
//#include "I2Cdev.h"
#include "MPU6050.h"
// #include <ESPmDNS.h>
#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
    #include "Wire.h"
#endif

#define USE_SERIAL Serial
#define RXD2 16
#define TXD2 17

//SCL 22
//SCK 21
//below en
const int tempSensorPin = 36;
//#define tempSensorPin 25


const int led = 13;
// const int tempSensorPin=25;

WiFiMulti wifiMulti;
//WebServer server(80);

//My computer
String serverPath="http://192.168.43.4:3000/data";

//His computer
//String serverPath="http://192.168.43.21:3000/data";
MPU6050 mpu;
HTTPClient http;
//float tempValue;
int16_t ax, ay, az;
int16_t gx, gy, gz;

// void TaskRx(void *pvParameters);
// void TaskJson(void *pvParameters);
// void TaskHttp(void *pvParameters);

// QueueHandle_t RxToJsonQueue;
// QueueHandle_t RxToHttpQueue;
// QueueHandle_t JsonToHttpQueue;

const size_t Capacity = 4*JSON_ARRAY_SIZE(3) + JSON_ARRAY_SIZE(10) + JSON_OBJECT_SIZE(6);

String readBuffer;
String lastSendString;

void setup() {
  USE_SERIAL.begin(115200);
  WiFi.mode(WIFI_STA);
  #if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
      Wire.begin();
  #elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE
      Fastwire::setup(400, true);
  #endif
  mpu.initialize();
  mpu.setXAccelOffset(332);
  mpu.setYAccelOffset(214);
  mpu.setZAccelOffset(805);

  Serial.println(mpu.testConnection() ? "MPU6050 connection successful" : "MPU6050 connection failed");
  for(uint8_t t = 4; t > 0; t--) {
      USE_SERIAL.printf("[SETUP] WAIT %d...\n", t);
      USE_SERIAL.flush();
      delay(1000);
  }

  wifiMulti.addAP("YourSSID", "yourPassword");
  if((wifiMulti.run() == WL_CONNECTED)) {
    Serial.println(WiFi.localIP());
    Serial.println("Connected");
  }
  Serial2.begin(4800, SERIAL_8N1, RXD2, TXD2);
//  readBuffer="0";
//  lastSendString="0";
    // xTaskCreatePinnedToCore(TaskRx,"TaskRx",configMINIMAL_STACK_SIZE*100,NULL,2,NULL,ARDUINO_RUNNING_CORE);
//    xTaskCreatePinnedToCore(TaskJson
//                            ,"TaskJson"
//                            ,102400
//                            ,NULL
//                            ,2
//                            ,NULL
//                            ,ARDUINO_RUNNING_CORE);
    // xTaskCreatePinnedToCore(TaskHttp
    //                         ,"TaskHttp"
    //                         ,configMINIMAL_STACK_SIZE*100
    //                         ,NULL
    //                         ,2
    //                         ,NULL
    //                         ,ARDUINO_RUNNING_CORE);
    // xTaskCreate(TaskRx,"TaskRx",10240,NULL,2,NULL);
    // xTaskCreate(TaskJson
    //                         ,"TaskJson"
    //                         ,102400
    //                         ,NULL
    //                         ,2
    //                         ,NULL);
    // xTaskCreate(TaskHttp
    //                         ,"TaskHttp"
    //                         ,102400
    //                         ,NULL
    //                         ,2
    //                         ,NULL);
    // RxToHttpQueue=xQueueCreate(30,100*sizeof(char));
}

// bool isRead=true;
// bool isSent=false;
//int motionRightShiftX;
//int motionRightShiftY;
//int motionRightShiftZ;
void loop() {
  //Empty
  //handle by task
  String jsonBuffer;
  //mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  //String jsonBuffer;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  DynamicJsonDocument doc(Capacity);
  JsonArray ecg = doc.createNestedArray("ecg");
  JsonArray temp = doc.createNestedArray("temp");
  JsonArray motion_x = doc.createNestedArray("motion_x");
  //motionRightShiftX=mpu.getAccelerationX();
//  motionRightShiftX=motionRightShiftX>>4;
  motion_x.add(ax);
  //Serial.println(ax);

  JsonArray motion_y = doc.createNestedArray("motion_y");
  //motionRightShiftY=mpu.getAccelerationY();
//  motionRightShiftY=motionRightShiftY>>4;
  motion_y.add(ay);
  //Serial.println(ay);

  JsonArray motion_z = doc.createNestedArray("motion_z");
  //motionRightShiftZ=mpu.getAccelerationZ();
//  motionRightShiftZ=motionRightShiftZ>>4;
  motion_z.add(az);
  //Serial.println(az);
  //motion_z.add(mpu.getAccelerationZ());

  analogReadResolution(10);
  analogSetAttenuation(ADC_2_5db);
  int tempAdcValue=analogRead(tempSensorPin);
  float tempValueVoltage=(float)tempAdcValue*0.0009765625*1500-100;
  float tempVal=(-0.0000078579)*tempValueVoltage*tempValueVoltage+(-0.177750)*tempValueVoltage+204.639;
  //Serial.println(tempValueVoltage);

  temp.add(tempVal);
  if((wifiMulti.run() == WL_CONNECTED)) {
    //http
    http.begin(serverPath);
    http.addHeader("Content-Type", "application/json");
    serializeJson(doc, jsonBuffer);
    int httpRespCode=http.POST(jsonBuffer);
    Serial.println(httpRespCode);
//    Serial.println(readBuffer);
//    lastSendString=readBuffer;
  }
  delay(80);
}


//void TaskRx(void *pvParameters){
//  (void) pvParameters;
//  //String readBuffer;
//  char charBuffer[50*sizeof(char)];
//  for(;;){
//    if(Serial2.available()>0&&Serial2.available()!='\r'){
//      readBuffer=Serial2.readStringUntil('\r');
//      int bufferLength=readBuffer.length();
//      char* charBuffer[bufferLength + 1];
//      readBuffer.toCharArray(charBuffer,bufferLength);
//      xQueueSend(RxToHttpQueue,&charBuffer,portMAX_DELAY);
//    }
//  }
//  vTaskDelete(NULL);
//}

// void TaskJson(void *pvParameters){
//   (void) pvParameters;
//   String jsonBuffer;
//   DynamicJsonDocument doc(Capacity);
//   JsonArray ecg = doc.createNestedArray("ecg");
//   JsonArray temp = doc.createNestedArray("temp");
//   JsonArray motion_x = doc.createNestedArray("motion_x");
//   JsonArray motion_y = doc.createNestedArray("motion_y");
//   JsonArray motion_z = doc.createNestedArray("motion_z");
//   for(;;){
//     if(RxToJsonQueue!=0){
//       //  const size_t Capacity = 4*JSON_ARRAY_SIZE(3) + JSON_ARRAY_SIZE(10) + JSON_OBJECT_SIZE(6);
//       // ecg.add(231);
//       //temp.add(tempValue);
//       // motion_x.add(123);
//       // motion_x.add(4532);
//       // motion_x.add(84);
//       // motion_y.add(123);
//       // motion_y.add(4532);
//       // motion_y.add(84);
//       // motion_z.add(123);
//       // motion_z.add(4532);
//       // motion_z.add(84);
//       doc["time_stamp"] = millis();
//       serializeJson(doc, jsonBuffer);
//       xQueueSend(JsonToHttpQueue,&jsonBuffer,portMAX_DELAY);
//       doc.clear();
//       vTaskDelay(1000/portTICK_PERIOD_MS);
//     }
//   }
//   vTaskDelete(NULL);
// }

// void TaskHttp(void *pvParameters){
//   (void) pvParameters;
//   String rxBuffer;

//   vTaskDelete( NULL );
// }
