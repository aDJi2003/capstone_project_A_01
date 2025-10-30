import mqtt from 'mqtt';

const OUTPUT_FORMAT = 'CSV';

const BROKER_URL = 'mqtt://localhost:1883';
const TOPIC = 'building/room/data';
const COMMAND_TOPIC = 'building/room/command';

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

    let payload;
    
    if (OUTPUT_FORMAT === 'CSV') {
      const orderedKeys = ['suhu', 'kelembapan', 'cahaya', 'gas', 'arus'];
      const values = orderedKeys.flatMap(key => [data[key].sensor1, data[key].sensor2]);
      payload = values.join(',');
      console.log(`Published CSV to topic [${TOPIC}]:`, payload);

    } else {
      payload = JSON.stringify(data);
      console.log(`Published JSON to topic [${TOPIC}]:`, payload);
    }

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
    console.log(`🕹️ Command Received: Set ${command.type} ${command.index} to ${command.level}`);
  }
});

client.on('error', (error) => {
  console.error('Connection error:', error);
  client.end();
});