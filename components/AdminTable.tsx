
import React, { useState, useMemo } from 'react';
import { AppUser } from '../types';

interface AdminTableProps {
  users: AppUser[];
  onClose: () => void;
  onAddUser: (user: Omit<AppUser, 'id' | 'wordCount' | 'pptCount'>) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (id: string | number) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({ users, onClose, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'ប្រុស' as 'ប្រុស' | 'ស្រី',
    role: 'គ្រូបង្រៀន',
    phone: '',
    username: '',
    password: '',
    wordCount: 0,
    pptCount: 0
  });

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerTerm) || 
      user.username.toLowerCase().includes(lowerTerm) ||
      user.phone.includes(searchTerm)
    );
  }, [users, searchTerm]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setShowFormPassword(false);
    setFormData({ 
      name: '', 
      gender: 'ប្រុស', 
      role: 'គ្រូបង្រៀន',
      phone: '', 
      username: '', 
      password: '',
      wordCount: 0,
      pptCount: 0
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setShowFormPassword(false);
    setFormData({
      name: user.name,
      gender: user.gender,
      role: user.role || 'គ្រូបង្រៀន',
      phone: user.phone,
      username: user.username,
      password: user.password,
      wordCount: user.wordCount,
      pptCount: user.pptCount
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData });
    } else {
      onAddUser(formData);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-purple-50 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                បញ្ជីគណនីអ្នកប្រើប្រាស់
                <span className="ml-2 px-3 py-0.5 bg-purple-200 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                  សរុប៖ {users.length}
                </span>
              </h2>
            </div>

            <div className="flex flex-grow max-w-md items-center gap-3">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  placeholder="ស្វែងរកតាមឈ្មោះ, Username, លេខទូរស័ព្ទ..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button 
                onClick={handleOpenAdd}
                className="whitespace-nowrap px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                បន្ថែមថ្មី
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Scrollable User List */}
        <div className="flex-grow overflow-auto p-6">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[900px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4 text-center w-16 border-b border-gray-200 dark:border-slate-700 rounded-tl-xl">លេខរៀង</th>
                <th className="py-4 px-4 border-b border-gray-200 dark:border-slate-700">ឈ្មោះ</th>
                <th className="py-4 px-4 text-center border-b border-gray-200 dark:border-slate-700">តួនាទី</th>
                <th className="py-4 px-4 text-center border-b border-gray-200 dark:border-slate-700">ភេទ</th>
                <th className="py-4 px-4 border-b border-gray-200 dark:border-slate-700">លេខទូរស័ព្ទ</th>
                <th className="py-4 px-4 border-b border-gray-200 dark:border-slate-700">Username</th>
                <th className="py-4 px-4 text-center border-b border-gray-200 dark:border-slate-700">Word</th>
                <th className="py-4 px-4 text-center border-b border-gray-200 dark:border-slate-700">PPT</th>
                <th className="py-4 px-4 text-center border-b border-gray-200 dark:border-slate-700 rounded-tr-xl">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredUsers.length > 0 ? filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors text-sm text-gray-600 dark:text-gray-400">
                  <td className="py-4 px-4 text-center font-medium">{index + 1}</td>
                  <td className="py-4 px-4 text-gray-900 dark:text-gray-200 font-semibold">{user.name}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-tight">{user.role || 'គ្រូបង្រៀន'}</span>
                  </td>
                  <td className="py-4 px-4 text-center">{user.gender}</td>
                  <td className="py-4 px-4 font-mono">{user.phone}</td>
                  <td className="py-4 px-4">{user.username}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
                      {user.wordCount}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold">
                      {user.pptCount}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-90"
                        title="កែសម្រួល"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => { if(window.confirm('តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?')) onDeleteUser(user.id); }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                        title="លុប"
                        disabled={user.username === 'admin'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${user.username === 'admin' ? 'opacity-30' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-gray-400 dark:text-gray-500 italic">
                    មិនមានទិន្នន័យត្រូវតាមការស្វែងរក
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-slate-900/30 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center px-8">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">កំពុងបង្ហាញអ្នកប្រើប្រាស់ចំនួន {filteredUsers.length} នាក់</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">គ្រប់គ្រងគណនីគ្រូបង្រៀន និងបុគ្គលិក</p>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[95vh]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">
              {editingUser ? 'កែសម្រួលគណនី' : 'បន្ថែមគណនីថ្មី'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ឈ្មោះ</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">តួនាទី</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="គ្រូបង្រៀន">គ្រូបង្រៀន</option>
                    <option value="នាយក">នាយក</option>
                    <option value="លេខា">លេខា</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ភេទ</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as 'ប្រុស' | 'ស្រី'})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="ប្រុស">ប្រុស</option>
                    <option value="ស្រី">ស្រី</option>
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">លេខទូរស័ព្ទ</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showFormPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 pr-10 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    {showFormPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {editingUser && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                  <div>
                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 uppercase tracking-wider">ចំនួន Word</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.wordCount}
                      onChange={(e) => setFormData({...formData, wordCount: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 uppercase tracking-wider">ចំនួន PPT</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.pptCount}
                      onChange={(e) => setFormData({...formData, pptCount: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-2xl font-bold transition-all border border-gray-200 dark:border-slate-600 active:scale-95"
                >
                  បោះបង់
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable;
