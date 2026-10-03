import mqtt, { MqttClient } from 'mqtt';
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';
import { telemetryIngestionService } from '../../modules/telemetry/telemetry-ingestion.service.js';
import { deviceIngestionService } from '../../modules/devices/device-ingestion.service.js';
import { pumpCommandService } from '../../modules/assets/pump-command.service.js';

class MqttManager {
  private client: MqttClient | null = null;
  private isConnected = false;

  public init() {
    const brokerUrl = env.MQTT_URL;
    logger.info({
      service: 'mqtt',
      event: 'connecting',
      message: `Connecting to MQTT broker at ${brokerUrl}`,
    });

    const options: mqtt.IClientOptions = {
      clientId: `${env.MQTT_CLIENT_ID}-${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 3000,
    };

    if (env.MQTT_USERNAME) {
      options.username = env.MQTT_USERNAME;
      options.password = env.MQTT_PASSWORD;
    }

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info({
        service: 'mqtt',
        event: 'connected',
        message: 'MQTT Broker connected successfully',
      });

      const subscribeTopic = `${env.MQTT_TOPIC_PREFIX}/+/+/+`;
      this.client?.subscribe(subscribeTopic, { qos: 1 }, (err) => {
        if (err) {
          logger.error({
            service: 'mqtt',
            event: 'subscribe_error',
            message: `Failed to subscribe to ${subscribeTopic}: ${err.message}`,
          });
        } else {
          logger.info({
            service: 'mqtt',
            event: 'subscribed',
            message: `Subscribed to ${subscribeTopic}`,
          });
        }
      });
    });

    this.client.on('message', async (topic, payloadBuffer) => {
      this.handleIncomingMessage(topic, payloadBuffer);
    });

    this.client.on('error', (err) => {
      logger.error({
        service: 'mqtt',
        event: 'client_error',
        message: err.message,
      });
    });

    this.client.on('offline', () => {
      this.isConnected = false;
      logger.warn({
        service: 'mqtt',
        event: 'offline',
        message: 'MQTT client offline, reconnecting...',
      });
    });

    // Provide publish capability to pumpCommandService
    pumpCommandService.setMqttPublisher(this.publish.bind(this));
  }

  private async handleIncomingMessage(topic: string, payloadBuffer: Buffer) {
    try {
      const parts = topic.split('/');
      // Expected: swpm/v1/{site_id}/{device_id}/{message_type}
      // Index:      0    1      2          3            4
      if (parts.length < 5 || parts[0] !== 'swpm') {
        return;
      }

      const siteId = parts[2];
      const deviceId = parts[3];
      const messageType = parts[4];

      const payloadStr = payloadBuffer.toString('utf-8');
      let payload: any;
      try {
        payload = JSON.parse(payloadStr);
      } catch (jsonErr: any) {
        logger.warn({
          service: 'mqtt',
          event: 'invalid_json',
          message: `Malformed JSON received on ${topic}`,
          topic,
        });
        return;
      }

      switch (messageType) {
        case 'telemetry':
          await telemetryIngestionService.ingest(siteId, deviceId, payload);
          break;
        case 'status':
          await deviceIngestionService.handleStatus(siteId, deviceId, payload);
          break;
        case 'event':
          await deviceIngestionService.handleEvent(siteId, deviceId, payload);
          break;
        case 'command_ack':
          await pumpCommandService.handleAck(siteId, deviceId, payload);
          break;
        default:
          break;
      }
    } catch (err: any) {
      logger.error({
        service: 'mqtt',
        event: 'message_processing_error',
        message: err.message,
        topic,
      });
    }
  }

  public async publish(topic: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.client || !this.isConnected) {
        logger.warn({
          service: 'mqtt',
          event: 'publish_not_connected',
          message: `Cannot publish to ${topic}: MQTT not connected`,
        });
        resolve(false);
        return;
      }

      this.client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          logger.error({
            service: 'mqtt',
            event: 'publish_error',
            message: `Publish error on ${topic}: ${err.message}`,
          });
          resolve(false);
        } else {
          logger.info({
            service: 'mqtt',
            event: 'published',
            message: `Message published to ${topic}`,
          });
          resolve(true);
        }
      });
    });
  }

  public getStatus() {
    return {
      connected: this.isConnected,
    };
  }

  public close() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttManager = new MqttManager();
