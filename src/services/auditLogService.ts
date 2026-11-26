import api, { handleApiErrorOrFallback } from './api';
import { AuditLog, Role } from '@/types';
import { mockAuditLogs } from './mockData';

let logsData = [...mockAuditLogs];

function mapAuditLog(raw: any): AuditLog {
  return {
    id: String(raw.id),
    actorId: String(raw.actorId ?? raw.actor_id ?? ''),
    actorName: raw.actorName || raw.actor_name || 'Hệ thống',
    actorRole: (raw.actorRole || raw.actor_role || 'ADMIN') as Role,
    action: raw.action || '',
    entityType: raw.entityType || raw.entity_type || '',
    entityId: String(raw.entityId ?? raw.entity_id ?? ''),
    details: raw.details || '',
    ipAddress: raw.ipAddress || raw.ip_address,
    timestamp: raw.timestamp || raw.created_at || new Date().toISOString(),
  };
}

export const auditLogService = {
  async getAuditLogs(params?: { action?: string; dateFrom?: string; dateTo?: string }): Promise<AuditLog[]> {
    try {
      const response = await api.get<any>('/audit-logs', {
        params: {
          action: params?.action || undefined,
          limit: 100,
        },
      });
      const payload = response.data?.data;
      const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      return items.map(mapAuditLog);
    } catch (err: any) {
      handleApiErrorOrFallback(err);
      let result = [...logsData];
      if (params?.action) {
        result = result.filter((l) => l.action.toLowerCase().includes(params.action!.toLowerCase()));
      }
      return result;
    }
  },

  async createLog(data: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...data,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    logsData.unshift(newLog);
    return newLog;
  },
};
