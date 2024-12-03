// Temporarily remove SQLite integration until we set up the backend properly
export const db = {
  async execute(query: string, params?: any[]) {
    // For now, we'll use localStorage
    const key = 'wts_db';
    let data = localStorage.getItem(key);
    let store = data ? JSON.parse(data) : { devices: [], schools: [], users: [] };
    
    return {
      rows: store[query] || []
    };
  }
};

export async function initializeDatabase() {
  // Initialize with default data if needed
  const key = 'wts_db';
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify({
      devices: [],
      schools: [],
      users: []
    }));
  }
}
