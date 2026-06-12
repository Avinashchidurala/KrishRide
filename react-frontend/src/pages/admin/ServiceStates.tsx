/**
 * Admin Service States Management Page
 * 
 * Allows admins to add, edit, and manage service states where Hushryd operates.
 */

import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, Save, X, CheckCircle, Circle } from 'lucide-react';
import adminStateService, { ServiceState, CreateStatePayload, UpdateStatePayload } from '../../services/adminStateService';
import LocationAutocomplete from '../../components/inputs/LocationAutocomplete';
import './ServiceStates.css';

interface FormData {
  name: string;
}

const ServiceStates: React.FC = () => {
  const [states, setStates] = useState<ServiceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
  });

  // Fetch states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      setError(null);
      const allStates = await adminStateService.getAllStates(true); // Include inactive states
      setStates(allStates);
    } catch (err) {
      console.error('Error fetching states:', err);
      setError('Failed to fetch service states');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsCreating(true);
    setFormData({ name: '' });
    setEditingId(null);
  };

  const handleEdit = (state: ServiceState) => {
    setEditingId(state.id);
    setFormData({
      name: state.name,
    });
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '' });
  };

  const handleSave = async () => {
    try {
      setError(null);

      // Validation
      if (!formData.name.trim()) {
        setError('State name is required');
        return;
      }

      if (isCreating) {
        // Create new state
        const payload: CreateStatePayload = {
          name: formData.name.trim(),
          is_active: true,
        };
        
        const newState = await adminStateService.createState(payload);
        setStates([...states, newState]);
        setSuccess('State created successfully');
      } else if (editingId) {
        // Update existing state
        const payload: UpdateStatePayload = {
          name: formData.name.trim(),
        };
        
        const updatedState = await adminStateService.updateState(editingId, payload);
        setStates(states.map(s => (s.id === editingId ? updatedState : s)));
        setSuccess('State updated successfully');
      }

      handleCancel();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err || 'Failed to save state');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        setError(null);
        await adminStateService.deleteState(id);
        setStates(states.filter(s => s.id !== id));
        setSuccess('State deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err || 'Failed to delete state');
      }
    }
  };

  const handleToggleState = async (id: string, currentStatus: boolean) => {
    try {
      setError(null);
      const updatedState = await adminStateService.toggleState(id, !currentStatus);
      setStates(states.map(s => (s.id === id ? updatedState : s)));
      setSuccess(`State ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err || 'Failed to toggle state');
    }
  };

  const handleSelectState = (id: string) => {
    const newSelected = new Set(selectedStates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStates.size === states.length) {
      setSelectedStates(new Set());
    } else {
      setSelectedStates(new Set(states.map(s => s.id)));
    }
  };

  const handleBulkToggle = async (activate: boolean) => {
    if (selectedStates.size === 0) {
      setError('Please select at least one state');
      return;
    }

    try {
      setError(null);
      const stateIds = Array.from(selectedStates);
      await adminStateService.bulkToggleStates(stateIds, activate);
      await fetchStates();
      setSelectedStates(new Set());
      setSuccess(`${selectedStates.size} state(s) ${activate ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err || 'Failed to update states');
    }
  };

  const activeCount = states.filter(s => s.is_active).length;
  const inactiveCount = states.length - activeCount;

  return (
    <div className="service-states-container">
      <div className="states-header">
        <div>
          <h1>Service States Management</h1>
          <p>Manage the states where Hushryd service is available</p>
        </div>
        <button 
          className="btn-primary"
          onClick={handleAdd}
          disabled={editingId !== null || isCreating}
        >
          <Plus size={20} />
          Add New State
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active States</p>
            <p className="stat-value">{activeCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <Circle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Inactive States</p>
            <p className="stat-value">{inactiveCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <span>📍</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total States</p>
            <p className="stat-value">{states.length}</p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <p>{success}</p>
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedStates.size > 0 && (
        <div className="bulk-actions">
          <p>{selectedStates.size} state(s) selected</p>
          <div className="bulk-buttons">
            <button 
              className="btn-secondary"
              onClick={() => handleBulkToggle(true)}
            >
              Activate
            </button>
            <button 
              className="btn-secondary btn-danger"
              onClick={() => handleBulkToggle(false)}
            >
              Deactivate
            </button>
          </div>
        </div>
      )}

      {/* Form for Add/Edit */}
      {(isCreating || editingId) && (
        <div className="form-card">
          <h2>{isCreating ? 'Add New State' : 'Edit State'}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">State Name *</label>
              <LocationAutocomplete
                value={formData.name}
                onSelect={(location) => setFormData({ ...formData, name: location.state !== 'Unknown' ? location.state : "" })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleSave}
            >
              <Save size={18} />
              Save
            </button>
            <button 
              className="btn-secondary"
              onClick={handleCancel}
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* States Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">
            <p>Loading service states...</p>
          </div>
        ) : states.length === 0 ? (
          <div className="empty-state">
            <p>No service states found</p>
            <button className="btn-primary" onClick={handleAdd}>
              <Plus size={18} />
              Add First State
            </button>
          </div>
        ) : (
          <table className="states-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedStates.size === states.length && states.length > 0}
                    onChange={handleSelectAll}
                    title="Select all"
                  />
                </th>
                <th>State Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {states.map((state) => (
                <tr key={state.id} className={state.is_active ? 'active' : 'inactive'}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStates.has(state.id)}
                      onChange={() => handleSelectState(state.id)}
                    />
                  </td>
                  <td className="state-name">{state.name}</td>
                  <td>
                    <span className={`badge ${state.is_active ? 'active' : 'inactive'}`}>
                      {state.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="date">{state.createdAt ? new Date(state.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleToggleState(state.id, state.is_active)}
                      title={state.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {state.is_active ? '⊗' : '⊕'}
                    </button>
                    <button
                      className="btn-icon edit"
                      onClick={() => handleEdit(state)}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(state.id, state.name)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>Quick Guide</h3>
        <ul>
          <li><strong>Add New State:</strong> Click "Add New State" button and fill in the state details</li>
          <li><strong>Edit State:</strong> Click the edit icon to modify state information</li>
          <li><strong>Toggle Availability:</strong> Use the status toggle or bulk actions to activate/deactivate states</li>
          <li><strong>Delete State:</strong> Click delete icon to remove a state (this action cannot be undone)</li>
          <li><strong>Bulk Operations:</strong> Select multiple states and use bulk actions for faster updates</li>
        </ul>
      </div>
    </div>
  );
};

export default ServiceStates;
