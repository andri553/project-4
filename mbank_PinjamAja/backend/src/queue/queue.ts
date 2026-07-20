import amqp from 'amqplib';
import { logger } from '../logger/logger';

const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://mbank_mq:mbank_mq_pass@localhost:5672';
let channel: amqp.Channel | null = null;
let isConnected = false;

export async function initRabbitMQ(): Promise<void> {
  try {
    const connection = await amqp.connect(rabbitMqUrl);
    channel = await connection.createChannel();
    
    // Assert queues
    await channel.assertQueue('audit_logs', { durable: true });
    await channel.assertQueue('security_events', { durable: true });

    logger.info('Connected to RabbitMQ and initialized queues.');
    isConnected = true;

    connection.on('error', (err) => {
      logger.warn({ err }, 'RabbitMQ connection error.');
      isConnected = false;
      channel = null;
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed.');
      isConnected = false;
      channel = null;
    });
  } catch (error) {
    logger.warn({ error }, 'Failed to connect to RabbitMQ. Logging via fallback mode.');
    isConnected = false;
  }
}

export function getRabbitMQStatus(): boolean {
  return isConnected;
}

export function publishToQueue(queue: 'audit_logs' | 'security_events', message: any): boolean {
  if (!channel || !isConnected) {
    logger.debug({ queue, message }, '[MQ Fallback] Logging event locally (RabbitMQ offline):');
    return false;
  }

  try {
    const sent = channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    return sent;
  } catch (error) {
    logger.warn({ error, queue }, 'Failed to publish message to RabbitMQ.');
    return false;
  }
}
