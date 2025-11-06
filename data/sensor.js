import mqtt from 'mqtt';

const OUTPUT_FORMAT = 'CSV';

const BROKER_URL = 'mqtt://localhost:1883';
const TOPIC = 'building/room/data';
// const BROKER_URL = 'mqtt://test.mosquitto.org:1883';
// const TOPIC = 'sensor/data/system';
const COMMAND_TOPIC = 'building/room/command';

const client = mqtt.connect(BROKER_URL, {
  clientId: `mqtt_sensor_simulator_${Math.random().toString(16).slice(3)}`,
});

const getRandomValue = (min, max, decimalPlaces = 2) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimalPlaces));
};

// client.on('connect', () => {
//   console.log('Connected to MQTT Broker!');
//   client.subscribe(COMMAND_TOPIC, (err) => {
//     if (!err) console.log(`Subscribed to command topic: [${COMMAND_TOPIC}]`);
//   });

//   setInterval(() => {
//     let payload;
  
//     const data = [
//       getRandomValue(200, 700, 0), // lux1
//       // getRandomValue(250, 750, 0), // lux2
//       getRandomValue(150, 400, 0), // mq
//       getRandomValue(0.1, 3, 0),   // acs
//       getRandomValue(24, 28),     // dhtTemp
//       getRandomValue(55, 65)      // dhtHum
//     ];

//     payload = data.join(',');
//     console.log(`Published CSV to topic [${TOPIC}]:`, payload);

//     client.publish(TOPIC, payload, { qos: 1 }, (error) => {
//       if (error) {
//         console.error('Publish error:', error);
//       }
//     });
//   }, 1000);
// });

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker!');
  client.subscribe(COMMAND_TOPIC, (err) => {
    if (!err) console.log(`👂 Subscribed to command topic: [${COMMAND_TOPIC}]`);
  });

  client.publish(TOPIC, "lux1,mq,acs,temperature,humidity");

  setInterval(() => {
    const data = [
      getRandomValue(200, 700, 0), // lux1 (cahaya)
      getRandomValue(150, 400, 0), // mq (gas)
      getRandomValue(1, 10, 0),   // acs (arus)
      getRandomValue(24, 28),     // dhtTemp (suhu)
      getRandomValue(55, 65)      // dhtHum (kelembapan)
    ];

    const payload = data.join(',');
    console.log(`Published CSV to topic [${TOPIC}]:`, payload);

    client.publish(TOPIC, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error('Publish error:', error);
      }
    });
  }, 1000);
});

client.on('message', (topic, payload) => {
  if (topic === COMMAND_TOPIC) {
    const command = JSON.parse(payload.toString());
    console.log(`Command Received: Set ${command.type} ${command.index} to ${command.level}`);
  }
});

client.on('error', (error) => {
  console.error('Connection error:', error);
  client.end();
});