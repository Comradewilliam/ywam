import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import Button from '../ui/Button';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const PhotoUpload: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!previewUrl || !user) return;

    setIsUploading(true);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, you would upload to a cloud storage service
      // For now, we'll just store the base64 data URL
      const updatedUser = {
        ...user,
        profilePhoto: previewUrl,
      };

      dispatch(updateUser(updatedUser));
      toast.success('Profile photo updated successfully');
      setPreviewUrl(null);
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        profilePhoto: undefined,
      };

      dispatch(updateUser(updatedUser));
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error('Failed to remove photo');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {previewUrl || user?.profilePhoto ? (
              <img
                src={previewUrl || user?.profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera size={48} className="text-gray-400" />
            )}
          </div>
          
          {(previewUrl || user?.profilePhoto) && (
            <button
              onClick={removePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mt-4 space-y-2">
          {previewUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex space-x-2"
            >
              <Button
                variant="primary"
                onClick={uploadPhoto}
                isLoading={isUploading}
                className="flex items-center"
              >
                <Upload size={16} className="mr-2" />
                Upload Photo
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setPreviewUrl(null)}
              >
                Cancel
              </Button>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              onClick={triggerFileInput}
              className="flex items-center"
            >
              <Camera size={16} className="mr-2" />
              {user?.profilePhoto ? 'Change Photo' : 'Add Photo'}
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          Supported formats: JPG, PNG, GIF<br />
          Maximum size: 5MB
        </p>
      </div>
    </div>
  );
};

export default PhotoUpload;