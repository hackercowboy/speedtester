const CronJob = require('cron').CronJob;
const SpeedTest = require('speedtest-net');
const kue = require('kue');
const axios = require('axios');

const queue = kue.createQueue();

queue.process('persist', (job, done) => {
  const deviceName = process.env.DEVICE_NAME;
  const measurements = [
    {
      key: `speedtest.${deviceName}.ping`,
      timestamp: job.data.timestamp,
      value: job.data.ping,
    },
    {
      key: `speedtest.${deviceName}.download`,
      timestamp: job.data.timestamp,
      value: job.data.download,
    },
    {
      key: `speedtest.${deviceName}.upload`,
      timestamp: job.data.timestamp,
      value: job.data.upload,
    },
  ];

  axios.post(process.env.API_ENDPOINT, measurements)
    .then(() => {
      done();
    })
    .catch((error) => {
      console.error(error);
      done(new Error('Could not persist'));
    });
});

const storeMeasurements = (results) => {
  queue.create('persist', results).attempts(10).backoff({ delay: 60 * 1000, type: 'exponential' }).save();
};

const runSpeedTest = () => {
  const speedTest = SpeedTest({ maxTime: 8000, proxy: process.env.PROXY });
  const time = new Date();
  speedTest.on('data', (data) => {
    const results = {
      timestamp: time,
      ping: data.server.ping,
      download: data.speeds.download,
      upload: data.speeds.upload,
    };
    console.log(results);
    storeMeasurements(results);
  });

  speedTest.on('error', () => {
    const results = {
      timestamp: time,
      ping: -1,
      down: -1,
      up: -1,
    };
    storeMeasurements(results);
  });
};

const speedTestJob = new CronJob({
  cronTime: '*/5 * * * *',
  onTick() {
    runSpeedTest();
  },
  start: false,
});
runSpeedTest();
speedTestJob.start();

