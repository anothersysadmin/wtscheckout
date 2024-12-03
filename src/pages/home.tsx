import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { getSchools } from '../lib/utils';

export function HomePage() {
  const schools = getSchools();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Select Your School
        </h2>
        <p className="mt-2 text-gray-600">
          Choose your school to manage device loans
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Link
            key={school.id}
            to={`/school/${school.id}`}
            className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center">
              {school.logoUrl ? (
                <div className="w-full h-full">
                  <img
                    src={school.logoUrl}
                    alt={`${school.name} logo`}
                    className="w-full h-full object-contain p-4"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                </div>
              ) : (
                <Building2 className="h-16 w-16 text-white opacity-75 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                {school.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
