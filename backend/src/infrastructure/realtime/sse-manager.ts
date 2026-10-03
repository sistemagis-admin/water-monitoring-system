import { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../shared/utils/logger.js';
import { env } from '../../config/env.js';

export interface SSEClient {
  id: string;
  siteId?: string;
  userId?: string;
  reply: FastifyReply;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.broadcastRaw(': ping\n\n');
    }, env.SSE_HEARTBEAT_INTERVAL);
  }

  public addClient(client: SSEClient) {
    this.clients.set(client.id, client);
    logger.info({
      service: 'sse',
      event: 'client_connected',
      message: `SSE client ${client.id} connected`,
      total_clients: this.clients.size,
    });

    client.reply.raw.on('close', () => {
      this.removeClient(client.id);
    });
  }

  public removeClient(clientId: string) {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      logger.info({
        service: 'sse',
        event: 'client_disconnected',
        message: `SSE client ${clientId} disconnected`,
        total_clients: this.clients.size,
      });
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }

  public broadcast(event: string, data: any, filterSiteId?: string) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (filterSiteId && client.siteId && client.siteId !== filterSiteId) {
        continue;
      }
      try {
        client.reply.raw.write(payload);
      } catch (err: any) {
        logger.warn({
          service: 'sse',
          event: 'delivery_error',
          message: `Error sending event to client ${client.id}: ${err.message}`,
        });
        this.removeClient(client.id);
      }
    }
  }

  private broadcastRaw(message: string) {
    for (const client of this.clients.values()) {
      try {
        client.reply.raw.write(message);
      } catch {
        this.removeClient(client.id);
      }
    }
  }

  public close() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const client of this.clients.values()) {
      try {
        client.reply.raw.end();
      } catch {}
    }
    this.clients.clear();
  }
}

export const sseManager = new SSEManager();
