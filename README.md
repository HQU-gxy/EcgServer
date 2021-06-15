# EcgServer
## Project Requirement
- [2020年TI杯大学生电子设计竞赛 无线运动传感器节点设计（A题)](https://www.nuedc-training.com.cn/index/news/details/new_id/222)
- [2020 年 TI 杯省级大学生电子设计竞赛仪器设备和主要元器件清单](https://www.nuedc-training.com.cn/index/news/details/new_id/201)



## Getting Started
```
├── arduino               # Arduino stuff
├── js                    # Compiled javascript files and front-end javascript
├── report                # Latex report
├── src                   # Typescript source files. 
├── static                # Static stuff. Like HTML, CSS and svg
└── README.md
```
### Prerequisites

- Arduino Mega
- ESP32
- LMT70
- MPU6050
- ADS1292R
- HC-05
- [Node.js](https://nodejs.org/zh-cn/)
- [TypeScript](https://www.typescriptlang.org/)
- [Arduino](https://www.arduino.cc/)
- [espressif/arduino-esp32: Arduino core for the ESP32](https://github.com/espressif/arduino-esp32)
- [ElectronicCats/mpu6050: MPU6050 Arduino Library](https://github.com/ElectronicCats/mpu6050)
- [Protocentral/protocentral-ads1292r-arduino: Arduino Library for the ADS1292R ECG/Respiration shield and breakout boards from ProtoCentral](https://github.com/Protocentral/protocentral-ads1292r-arduino)

### Installation
Install the node packages. 
```bash
npm install npm@latest -g
npm install -g typescript
npm install
```
Install the board definition of ESP32, and all the libraries mentioned above. 


## Usage 
### Hardware
#### Arduino Mega

- Connect ADS1292R and HC-05 to Arduino Mega. 
- HC-05 is connected to Serial 1. 
- Flash `arduino/mega_ecg` to Arduino Mega. 

#### ESP32
- Connect MPU6050, LMT70 to your ESP32. The pin definition for it can be found in `arduino/esp32_http`. 
- Change `serverPath` to your host path, and change `wifiMulti.addAP("YourSSID", "yourPassword");` to your actual WiFi access point. 
- Flash `arduino/esp32_http` to ESP32, using Arduino IDE. 
### Node Server
The default port is `3000`, and WebSocket port for Heart Rate is `3001`, which you can change in `src/index.ts` and `js/client.js`. 

The default serial port for Bluetooth communication is `COM15`, which is defined in `src/index.ts`. 

Compile typescript script for server. 
```bash
tsc
```
Launch the server.  
```bash
node js/index.js
```

## Libraries used
See `package.json`

Libraries used by front-end. Maybe there's more, but I don't remember. 
- [Smoothie Charts: A JavaScript Charting Library for Streaming Data](http://smoothiecharts.org/)
- [Bootstrap · The most popular HTML, CSS, and JS library in the world.](https://getbootstrap.com/)
- [Papa Parse - Powerful CSV Parser for JavaScript](https://www.papaparse.com/)

## FAQ
### How do the bluetooth work? 
Pair HC-05 with your Windows PC (Linux hasn't been tested) and you will find a Serial Port will pop up from nowhere. That's from HC-05, and you can use it as a serial port. 

- [The Step by Step Guide to Using Bluetooth in Windows 10](https://www.technorms.com/46164/bluetooth-guide-windows-10)
- [Add a Bluetooth COM Port (Incoming) - Windows | Verizon](https://www.verizon.com/support/knowledge-base-20605/)

### Chinese documentation? 
Nope. 

## License

```
            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.
```
