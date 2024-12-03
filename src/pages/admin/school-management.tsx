import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { getSchools, saveSchools, fileToBase64, type School } from '../../lib/utils';
import toast from 'react-hot-toast';

export function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>(getSchools());
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    allowNewDevices: false,
    logoUrl: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSchool) {
      const updatedSchools = schools.map(school =>
        school.id === editingSchool.id
          ? { ...school, ...formData }
          : school
      );
      setSchools(updatedSchools);
      saveSchools(updatedSchools);
    } else {
      const newSchool = {
        ...formData,
        id: formData.name.toLowerCase().replace(/\s+/g, '-'),
      };
      const updatedSchools = [...schools, newSchool];
      setSchools(updatedSchools);
      saveSchools(updatedSchools);
    }
    
    setShowForm(false);
    setEditingSchool(null);
    setFormData({ name: '', address: '', contact: '', allowNewDevices: false, logoUrl: '' });
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address || '',
      contact: school.contact || '',
      allowNewDevices: school.allowNewDevices,
      logoUrl: school.logoUrl || '',
    });
    setShowForm(true);
  };

  const handleDelete = (schoolId: string) => {
    if (confirm('Are you sure you want to delete this school?')) {
      const updatedSchools = schools.filter(school => school.id !== schoolId);
      setSchools(updatedSchools);
      saveSchools(updatedSchools);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG or PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, logoUrl: base64 }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-sky-500" />
          <h2 className="text-3xl font-bold text-gray-900">Schools</h2>
        </div>
        <button
          onClick={() => {
            setEditingSchool(null);
            setFormData({ name: '', address: '', contact: '', allowNewDevices: false, logoUrl: '' });
            setShowForm(!showForm);
          }}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add School
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                School Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Information
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowNewDevices"
                checked={formData.allowNewDevices}
                onChange={(e) => setFormData({ ...formData, allowNewDevices: e.target.checked })}
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
              />
              <label htmlFor="allowNewDevices" className="ml-2 block text-sm text-gray-900">
                Allow auto-adding of unregistered devices during checkout
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                School Logo
              </label>
              <div className="mt-1 flex items-center space-x-4">
                {formData.logoUrl && (
                  <img
                    src={formData.logoUrl}
                    alt="School logo preview"
                    className="h-16 w-16 object-contain"
                  />
                )}
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
              >
                {editingSchool ? 'Update School' : 'Add School'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {schools.map((school) => (
          <div key={school.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {school.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt={`${school.name} logo`}
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-gray-400" />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{school.name}</h3>
                  {school.address && (
                    <p className="text-sm text-gray-500">{school.address}</p>
                  )}
                  {school.contact && (
                    <p className="text-sm text-gray-500">{school.contact}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  school.allowNewDevices
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {school.allowNewDevices ? 'Auto-Add Enabled' : 'Auto-Add Restricted'}
                </span>
                <button
                  onClick={() => handleEdit(school)}
                  className="text-sky-600 hover:text-sky-900"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(school.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
