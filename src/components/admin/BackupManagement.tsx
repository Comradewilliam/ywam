import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Database, Download, Upload, Trash2, RefreshCw, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { backupService, BackupData } from '../../services/backupService';
import { toast } from 'react-toastify';

const BackupManagement: React.FC = () => {
  const { users } = useSelector((state: RootState) => state.users);
  const { meditation, meals, workDuties } = useSelector((state: RootState) => state.schedules);
  const { messages } = useSelector((state: RootState) => state.messages);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    const allBackups = backupService.getBackups();
    setBackups(allBackups);
  };

  const createBackup = async () => {
    if (!currentUser) return;
    
    setIsCreatingBackup(true);
    
    try {
      const data = {
        users,
        meditations: meditation,
        meals,
        workDuties,
        messages,
      };
      
      const backup = await backupService.createBackup(
        data,
        currentUser.id,
        backupDescription || 'Manual backup'
      );
      
      setBackups([backup, ...backups]);
      setBackupDescription('');
      toast.success('Backup created successfully');
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = (backup: BackupData) => {
    try {
      const backupJson = backupService.exportBackup(backup.id);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ywam-dar-backup-${backup.timestamp.split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will replace all current data.')) {
      return;
    }
    
    setIsRestoring(true);
    
    try {
      const restoredData = await backupService.restoreBackup(backupId);
      
      // In a real application, this would update the Redux store and database
      console.log('Restored data:', restoredData);
      
      toast.success('Backup restored successfully. Please refresh the page.');
    } catch (error) {
      toast.error('Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      const success = backupService.deleteBackup(backupId);
      if (success) {
        setBackups(backups.filter(b => b.id !== backupId));
        toast.success('Backup deleted successfully');
      } else {
        toast.error('Failed to delete backup');
      }
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    
    try {
      const text = await file.text();
      const backup = await backupService.importBackup(text);
      
      setBackups([backup, ...backups]);
      toast.success('Backup imported successfully');
    } catch (error) {
      toast.error('Failed to import backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setImportFile(null);
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
          <p className="text-gray-600">Create, restore, and manage system backups</p>
        </div>
        
        <Button
          variant="primary"
          onClick={loadBackups}
          className="flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Create Backup */}
      <Card title="Create New Backup">
        <div className="space-y-4">
          <Input
            label="Backup Description (Optional)"
            value={backupDescription}
            onChange={(e) => setBackupDescription(e.target.value)}
            placeholder="e.g., Before system update"
            fullWidth
          />
          
          <div className="flex space-x-4">
            <Button
              variant="primary"
              onClick={createBackup}
              isLoading={isCreatingBackup}
              className="flex items-center"
            >
              <Database size={16} className="mr-2" />
              Create Backup
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                className="flex items-center"
              >
                <Upload size={16} className="mr-2" />
                Import Backup
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Backup List */}
      <Card title="Available Backups">
        <div className="space-y-4">
          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No backups available. Create your first backup above.
            </div>
          ) : (
            backups.map((backup) => (
              <motion.div
                key={backup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="font-medium">
                        {new Date(backup.timestamp).toLocaleString()}
                      </span>
                      {backup.metadata.description && (
                        <span className="text-sm text-gray-600">
                          - {backup.metadata.description}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <span>Users: {backup.metadata.totalUsers}</span>
                      <span className="mx-2">•</span>
                      <span>Total Records: {backup.metadata.totalRecords}</span>
                      <span className="mx-2">•</span>
                      <span>Size: {formatFileSize(backupService.getBackupSize(backup))}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadBackup(backup)}
                      className="flex items-center"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => restoreBackup(backup.id)}
                      isLoading={isRestoring}
                      className="flex items-center"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Restore
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.id)}
                      className="flex items-center text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Backup Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{backups.length}</div>
            <div className="text-sm text-gray-600">Total Backups</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatFileSize(backupService.getTotalBackupSize())}
            </div>
            <div className="text-sm text-gray-600">Total Storage Used</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {backups.length > 0 ? new Date(backups[0].timestamp).toLocaleDateString() : 'Never'}
            </div>
            <div className="text-sm text-gray-600">Last Backup</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BackupManagement;