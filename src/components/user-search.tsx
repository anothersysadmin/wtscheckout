import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../lib/api';

type UserSearchProps = {
  onSelect: (userId: string) => void;
  selectedUserId: string | null;
};

export function UserSearch({ onSelect, selectedUserId }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    // Add error handling and retry configuration
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Error fetching users:', error);
    }
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = users.find(user => user.id === selectedUserId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={selectedUser ? selectedUser.name : searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
            if (selectedUserId) onSelect('');
          }}
          onFocus={() => setShowDropdown(true)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 pl-10"
          placeholder="Search by name or email"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {showDropdown && searchQuery && filteredUsers.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-lg max-h-60 overflow-auto">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelect(user.id);
                setSearchQuery('');
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              <div className="text-sm font-medium text-gray-900">
                {user.name}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
