import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { uploadLogo } from '../lib/api';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export function LogoUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Logo updated successfully');
      setPreview(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PNG, JPG, or SVG file.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB.';
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;
    await uploadMutation.mutateAsync(preview);
  };

  const handleRevert = () => {
    uploadMutation.mutate(null);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">System Logo</h3>
        {preview && (
          <button
            onClick={() => setPreview(null)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {preview ? (
        <div className="space-y-4">
          <div className="relative w-48 h-48 mx-auto">
            <img
              src={preview}
              alt="Logo preview"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleRevert}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Revert to Default
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="h-5 w-5 mr-2" />
            Upload New Logo
            <input
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">
        Recommended: 200x200px PNG, JPG, or SVG (max 2MB)
      </p>
    </div>
  );
}
