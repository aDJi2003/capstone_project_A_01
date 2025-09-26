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
      suhu: {
        sensor1: getRandomValue(24, 28),
        sensor2: getRandomValue(24.5, 28.5)
      },
      kelembapan: {
        sensor1: getRandomValue(55, 65),
        sensor2: getRandomValue(57, 67)
      },
      cahaya: {
        sensor1: getRandomValue(200, 700, 0),
        sensor2: getRandomValue(250, 750, 0)
      },
      gas: {
        sensor1: getRandomValue(150, 400, 0),
        sensor2: getRandomValue(160, 410, 0)
      },
      arus: {
        sensor1: getRandomValue(0.1, 1.5),
        sensor2: getRandomValue(0.15, 1.6)
      }
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