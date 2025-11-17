import mqtt from 'mqtt';

const OUTPUT_FORMAT = 'CSV';

// const BROKER_URL = 'mqtt://localhost:1883';
// const TOPIC = 'building/room/data';
const BROKER_URL = 'mqtt://broker.hivemq.com:1883';
const TOPIC = 'sensor/data/system';
const COMMAND_TOPIC = 'denio/keren';

const client = mqtt.connect(BROKER_URL, {
  clientId: `mqtt_sensor_simulator_${Math.random().toString(16).slice(3)}`,
});

const getRandomValue = (min, max, decimalPlaces = 2) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimalPlaces));
};

client.on('connect', () => {
  console.log('Connected to MQTT Broker!');
  client.subscribe(COMMAND_TOPIC, (err) => {
    if (!err) console.log(`Subscribed to command topic: [${COMMAND_TOPIC}]`);
  });

  client.publish(TOPIC, "lux1,lux2,lux3,lux4,mq1,mq2,temp1,temp2,hum1,hum2,acs1");

  setInterval(() => {
    const data = [
      getRandomValue(200, 700, 0), // cahaya 1
      getRandomValue(200, 700, 0), // cahaya 2
      getRandomValue(200, 700, 0), // cahaya 3
      getRandomValue(200, 700, 0), // cahaya 4
      getRandomValue(150, 400, 0), // gas 1
      getRandomValue(160, 410, 0), // gas 2
      getRandomValue(24, 28),     // suhu 1
      getRandomValue(25, 29),     // suhu 2
      getRandomValue(55, 65),     // kelembapan 1
      getRandomValue(57, 67),     // kelembapan 2
      getRandomValue(0.5, 3, 0)    // arus 1
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