
import React, { useState, useEffect } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { ApplicationStatus, Candidate } from '../types';
import { MoreHorizontal, Plus, Star, X, Trash2 } from 'lucide-react';
import DataControls from '../components/DataControls';

const Recruitment: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('recruitment_candidates');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_CANDIDATES : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Simulated Admin Status
  const isAdmin = true;
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    experience: '',
    status: ApplicationStatus.APPLIED,
  });

  // Persist Changes
  useEffect(() => {
    localStorage.setItem('recruitment_candidates', JSON.stringify(candidates));
  }, [candidates]);

  const columns = [
    { title: 'جديد', status: ApplicationStatus.APPLIED, color: 'border-blue-500' },
    { title: 'فرز أولي', status: ApplicationStatus.SCREENING, color: 'border-purple-500' },
    { title: 'مقابلات', status: ApplicationStatus.INTERVIEW, color: 'border-yellow-500' },
    { title: 'عروض عمل', status: ApplicationStatus.OFFER, color: 'border-green-500' },
  ];

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    if (!draggedId) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === draggedId ? { ...c, status: newStatus } : c))
    );
    setDraggedId(null);
  };

  // Delete Candidate
  const handleDeleteCandidate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا المرشح؟')) {
      setCandidates(candidates.filter(c => c.id !== id));
    }
  };

  // Form Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCandidate: Candidate = {
      id: `C${Date.now()}`,
      name: formData.name,
      position: formData.position,
      experience: formData.experience,
      status: formData.status as ApplicationStatus,
      rating: 0,
    };
    setCandidates([...candidates, newCandidate]);
    setIsModalOpen(false);
    setFormData({ name: '', position: '', experience: '', status: ApplicationStatus.APPLIED }); // Reset form
  };

  const handleImport = (data: any[]) => {
    const newCandidates = data.map((d: any, idx) => ({
      ...d,
      id: `IMP-C${Date.now()}-${idx}`,
      status: d.status || ApplicationStatus.APPLIED,
      rating: Number(d.rating) || 0
    }));
    setCandidates([...candidates, ...newCandidates]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] relative">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التوظيف</h2>
          <p className="text-sm text-gray-500">تتبع المرشحين ومراحل التعيين (اسحب وأفلت لتغيير الحالة)</p>
        </div>
        <div className="flex gap-3">
          <DataControls
            data={candidates}
            fileName="recruitment_candidates"
            onImport={handleImport}
            isAdmin={isAdmin}
            headers={[
              { key: 'name', label: 'الاسم' },
              { key: 'position', label: 'الوظيفة' },
              { key: 'experience', label: 'الخبرة' },
              { key: 'status', label: 'الحالة' },
              { key: 'rating', label: 'التقييم' }
            ]}
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">إضافة مرشح</span>
          </button>
        </div>
      </div>

      <div className="flex h-full gap-6 overflow-x-auto pb-4">
        {columns.map((col) => {
          const items = candidates.filter((c) => c.status === col.status);
          
          return (
            <div 
              key={col.title} 
              className="flex h-full min-w-[300px] flex-col rounded-xl bg-gray-50 border border-gray-200 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className={`border-t-4 bg-white p-4 rounded-t-xl ${col.color} border-b border-gray-100`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">{col.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {items.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {items.map((candidate) => (
                  <div 
                    key={candidate.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidate.id)}
                    className="group relative rounded-lg bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md cursor-grab active:cursor-grabbing transition-all active:scale-95"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{candidate.name}</h4>
                      <button 
                        onClick={(e) => handleDeleteCandidate(candidate.id, e)}
                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{candidate.position}</p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{candidate.experience}</span>
                      {candidate.rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span className="text-xs font-medium text-gray-600">{candidate.rating}</span>
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {items.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
                    اسحب هنا
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">إضافة مرشح جديد</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">الاسم</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="اسم المرشح"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">الوظيفة</label>
                  <input
                    type="text"
                    name="position"
                    required
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="المسمى الوظيفي"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">الخبرة</label>
                    <input
                      type="text"
                      name="experience"
                      required
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="مثال: 3 سنوات"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">الحالة الأولية</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {(Object.values(ApplicationStatus) as string[]).map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;
