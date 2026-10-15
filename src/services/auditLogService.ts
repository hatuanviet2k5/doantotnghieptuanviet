import api from './api';
import { AuditLog } from '@/types';
import { mockAuditLogs } from './mockData';

let logsData = [...mockAuditLogs];

export const auditLogService = {
  async getAuditLogs(params?: { action?: string; dateFrom?: string; dateTo?: string }): Promise<AuditLog[]> {
    try {
      const response = await api.get<AuditLog[]>('/audit-logs', { params });
      return response.data;
    } catch {
      let result = [...logsData];
      if (params?.action) {
        result = result.filter((l) => l.action.toLowerCase().includes(params.action!.toLowerCase()));
      }
      return result;
    }
  },

  async createLog(data: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    try {
      const response = await api.post<AuditLog>('/audit-logs', data);
      return response.data;
    } catch {
      const newLog: AuditLog = {
        ...data,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      logsData.unshift(newLog);
      return newLog;
    }
  },
};
