import { mqttSimulatorService } from './simulator.service.js';

console.log('========================================================================');
console.log('⚡ SWPMS Industrial IoT Edge & Telemetry Simulator CLI');
console.log('🏢 PT Ascon Multi Pratama - Virtual PLC & Sensor Network');
console.log('========================================================================');

async function main() {
  try {
    await mqttSimulatorService.start();
    console.log('🚀 Simulator running. Telemetry is being streamed to MQTT broker.');
    console.log('Press Ctrl+C to terminate simulator.');

    const cleanup = () => {
      console.log('\nStopping MQTT Simulator...');
      mqttSimulatorService.stop();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (err) {
    console.error('Failed to run simulator:', err);
    process.exit(1);
  }
}

main();
