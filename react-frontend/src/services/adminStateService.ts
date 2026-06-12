/**
 * Admin State Management Service
 * 
 * API service for managing service states from the admin panel.
 */

import api from './api';

export interface ServiceState {
  id: string;
  name: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStatePayload {
  name: string;
  is_active?: boolean;
}

export interface UpdateStatePayload {
  name?: string;
  is_active?: boolean;
}

class AdminStateService {
  /**
   * Get all service states
   */
  async getAllStates(includeInactive: boolean = false): Promise<ServiceState[]> {
    try {
      const params = includeInactive ? '?active=false' : '';
      const response = await api.get(`/admin/service-states${params}`);
      return response.data.states || [];
    } catch (error) {
      console.error('Error fetching states:', error);
      throw error;
    }
  }

  /**
   * Get single state by ID
   */
  async getStateById(id: string): Promise<ServiceState> {
    try {
      const response = await api.get(`/admin/service-states/${id}`);
      return response.data.state;
    } catch (error) {
      console.error('Error fetching state:', error);
      throw error;
    }
  }

  /**
   * Create new service state
   */
  async createState(payload: CreateStatePayload): Promise<ServiceState> {
    try {
      const response = await api.post('/admin/service-states', payload);
      return response.data.state;
    } catch (error: any) {
      console.error('Error creating state:', error);
      throw error.response?.data?.error || 'Failed to create state';
    }
  }

  /**
   * Update service state
   */
  async updateState(id: string, payload: UpdateStatePayload): Promise<ServiceState> {
    try {
      const response = await api.put(`/admin/service-states/${id}`, payload);
      return response.data.state;
    } catch (error: any) {
      console.error('Error updating state:', error);
      throw error.response?.data?.error || 'Failed to update state';
    }
  }

  /**
   * Delete service state
   */
  async deleteState(id: string): Promise<void> {
    try {
      await api.delete(`/admin/service-states/${id}`);
    } catch (error: any) {
      console.error('Error deleting state:', error);
      throw error.response?.data?.error || 'Failed to delete state';
    }
  }

  /**
   * Toggle state availability (activate/deactivate)
   */
  async toggleState(id: string, isActive: boolean): Promise<ServiceState> {
    try {
      const response = await api.put(`/admin/service-states/${id}`, { is_active: isActive });
      return response.data.state;
    } catch (error: any) {
      console.error('Error toggling state:', error);
      throw error.response?.data?.error || 'Failed to toggle state';
    }
  }

  /**
   * Bulk toggle multiple states
   */
  async bulkToggleStates(stateIds: string[], isActive: boolean): Promise<{ count: number }> {
    try {
      const response = await api.post('/admin/service-states/bulk/toggle', {
        stateIds,
        is_active: isActive,
      });
      return { count: response.data.count };
    } catch (error: any) {
      console.error('Error toggling states:', error);
      throw error.response?.data?.error || 'Failed to toggle states';
    }
  }

  /**
   * Get available states (for location validation)
   */
  async getAvailableStates(): Promise<ServiceState[]> {
    try {
      const response = await api.get('/public/service-states');
      return response.data.states || [];
    } catch (error) {
      console.error('Error fetching available states:', error);
      return [];
    }
  }
}

export default new AdminStateService();
