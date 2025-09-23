import mqtt from 'mqtt';

const BROKER_URL = 'mqtt://localhost:1883';
const TOPIC = 'building/room/data';

const client = mqtt.connect(BROKER_URL, {
  clientId: `mqtt_sensor_simulator_${Math.random().toString(16).slice(3)}`,
});

const getRandomValue = (min, max, decimalPlaces = 2) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimalPlaces));
};

client.on('connect', () => {
  console.log('Connected to MQTT Broker!');
  setInterval(() => {
    const data = {
      suhu: getRandomValue(24, 28),
      kelembapan: getRandomValue(55, 65),
      cahaya: getRandomValue(200, 700, 0),
      gas: getRandomValue(150, 400, 0),
      arus: getRandomValue(0.1, 1.5)
    };

    const payload = JSON.stringify(data);

    client.publish(TOPIC, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error('Publish error:', error);
      } else {
        console.log(`Published to topic [${TOPIC}]:`, payload);
      }
    });
  }, 1000);
});

client.on('error', (error) => {
  console.error('Connection error:', error);
  client.end();
});