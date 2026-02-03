import { apiClient } from './client';
import type { StatsResponse, ContactRequest, ContactResponse, HealthResponse } from './types';

/**
 * Core API endpoints for stats, health, and contact
 */
export const coreApi = {
  /**
   * Get application statistics
   */
  async getStats(): Promise<StatsResponse> {
    const response = await apiClient.get<StatsResponse>('/stats/');
    return response.data;
  },

  /**
   * Get API health status
   */
  async getHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/health/');
    return response.data;
  },

  /**
   * Submit a contact form
   */
  async submitContact(data: ContactRequest): Promise<ContactResponse> {
    const response = await apiClient.post<ContactResponse>('/contact/', data);
    return response.data;
  },
};
