
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { MOCK_CANDIDATES, MOCK_EMPLOYEES, MOCK_JOB_TITLES } from '../constants';
import { ApplicationStatus, Candidate, Employee, EmploymentType, SystemDefinition } from '../types';
import { Plus, Star, X, Trash2, UserPlus, Search, Filter, Briefcase, Phone, Calendar, FileText, Paperclip, ChevronRight } from 'lucide-react';
import DataControls from '../components/DataControls';
import { AppContext } from '../App';
import { api } from '../services/api';

const Recruitment: React.FC = () => {
  const { isServerOnline, addNotification } = useContext(AppContext);
  
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('recruitment_candidates');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_CANDIDATES : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
      const saved = localStorage.getItem('employees_data');
      return saved ? JSON.parse(saved) : MOCK_EMPLOYEES;
  });

  const [jobTitles] = useState<SystemDefinition[]>(() => {
    const saved = localStorage.getItem('system_job_titles');
    return saved ? JSON.parse(saved) : MOCK_JOB_TITLES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'timeline' | 'scorecard'>('profile');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState<string>('all');
  
  const isAdmin = true;
  
  const [formData, setFormData] = useState<Partial<Candidate>>({
    name: '',
    position: '',
    experience: '',
    email: '',
    phone: '',
    status: ApplicationStatus.APPLIED,
  });

  // Extract unique positions for "Job Openings" sidebar
  const activePositions = useMemo(() => {
      const positions = Array.from(new Set(candidates.map(c => c.position)));
      return positions.sort();
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('recruitment_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('employees_data', JSON.stringify(employees));
  }, [employees]);

  const columns = [
    { title: 'جديد', status: ApplicationStatus.APPLIED, color: 'border-t-blue-500', bg: 'bg-blue-50' },
    { title: 'فرز أولي', status: ApplicationStatus.SCREENING, color: 'border-t-purple-500', bg: 'bg-purple-50' },
    { title: 'مقابلات', status: ApplicationStatus.INTERVIEW, color: 'border-t-yellow-500', bg: 'bg-yellow-50' },
    { title: 'عروض عمل', status: ApplicationStatus.OFFER, color: 'border-t-green-500', bg: 'bg-green-50' },
  ];

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

  const handleHireCandidate = async (candidate: Candidate) => {
      if (!window.confirm(`هل أنت متأكد من تعيين "${candidate.name}" كموظف جديد؟\nسيتم نقله إلى قاعدة بيانات الموظفين.`)) return;

      const salaryInput = window.prompt(`تحديد الراتب الأساسي لـ ${candidate.name}:`, "3000");
      if (salaryInput === null) return;

      const departmentInput = window.prompt(`تحديد القسم لـ ${candidate.name}:`, "عام");
      if (departmentInput === null) return;

      const newEmpCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newEmployee: Employee = {
          id: `E-${Date.now()}`,
          employeeCode: newEmpCode,
          name: candidate.name,
          jobTitle: candidate.position,
          department: departmentInput,
          joinDate: new Date().toISOString().split('T')[0],
          salary: Number(salaryInput) || 0,
          status: 'active',
          nationalId: '',
          contractType: EmploymentType.FULL_TIME,
          avatar: `https://ui-avatars.com/api/?name=${candidate.name}&background=random`,
          email: candidate.email,
          phone: candidate.phone
      };

      if (isServerOnline) {
          try {
              await api.saveEmployee(newEmployee);
          } catch (err) {
              console.error(err);
          }
      } else {
          setEmployees(prev => [...prev, newEmployee]);
      }

      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: ApplicationStatus.HIRED } : c));
      setIsDetailModalOpen(false);
      addNotification('تم التعيين', `تم تعيين ${candidate.name} بنجاح.`);
  };

  const handleDeleteCandidate = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا المرشح؟')) {
      setCandidates(candidates.filter(c => c.id !== id));
      setIsDetailModalOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCandidate: Candidate = {
      id: `C${Date.now()}`,
      name: formData.name || '',
      position: formData.position || '',
      experience: formData.experience || '',
      email: formData.email,
      phone: formData.phone,
      status: formData.status || ApplicationStatus.APPLIED,
      rating: 0,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    setCandidates([...candidates, newCandidate]);
    setIsModalOpen(false);
    setFormData({ name: '', position: '', experience: '', status: ApplicationStatus.APPLIED, email: '', phone: '' });
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

  const handleOpenDetail = (candidate: Candidate) => {
      setSelectedCandidate(candidate);
      setDetailTab('profile');
      setIsDetailModalOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      
      {/* Sidebar - Job Openings */}
      <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  الوظائف المفتوحة
              </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
              <button 
                  onClick={() => setFilterPosition('all')}
                  className={`w-full text-right px-4 py-2 rounded-lg text-sm font-medium mb-1 transition-colors ${filterPosition === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                  الكل
                  <span className="float-left bg-gray-200 text-gray-600 px-2 rounded-full text-xs">{candidates.length}</span>
              </button>
              {activePositions.map(pos => {
                  const count = candidates.filter(c => c.position === pos).length;
                  return (
                    <button 
                        key={pos}
                        onClick={() => setFilterPosition(pos)}
                        className={`w-full text-right px-4 py-2 rounded-lg text-sm font-medium mb-1 transition-colors ${filterPosition === pos ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {pos}
                        <span className="float-left bg-gray-100 text-gray-500 px-2 rounded-full text-xs">{count}</span>
                    </button>
                  );
              })}
          </div>
          <div className="p-4 border-t border-gray-100">
              <button className="w-full border border-dashed border-gray-300 rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> فتح وظيفة جديدة
              </button>
          </div>
      </div>

      {/* Main Board */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">التوظيف</h2>
                <p className="text-sm text-gray-500">
                    {filterPosition === 'all' ? 'عرض جميع المرشحين' : `مرشحين لوظيفة: ${filterPosition}`}
                </p>
            </div>
            <div className="flex gap-2">
                <DataControls data={candidates} fileName="recruitment_candidates" onImport={handleImport} isAdmin={isAdmin} />
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">إضافة مرشح</span>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex h-full gap-4 min-w-max">
                {columns.map((col) => {
                const items = candidates.filter((c) => c.status === col.status && (filterPosition === 'all' || c.position === filterPosition));
                
                return (
                    <div 
                    key={col.title} 
                    className="flex h-full w-72 flex-col rounded-xl bg-gray-50 border border-gray-200"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.status)}
                    >
                        <div className={`p-3 rounded-t-xl border-t-4 ${col.color} bg-white border-b border-gray-100 flex justify-between items-center`}>
                            <h3 className="font-bold text-gray-800">{col.title}</h3>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{items.length}</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {items.map((candidate) => (
                            <div 
                                key={candidate.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, candidate.id)}
                                onClick={() => handleOpenDetail(candidate)}
                                className="group relative rounded-lg bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:border-indigo-200"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm">{candidate.name}</h4>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-2 truncate" title={candidate.position}>{candidate.position}</p>
                                
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{candidate.experience}</span>
                                    {candidate.rating > 0 && (
                                        <div className="flex items-center gap-0.5 text-yellow-500">
                                        <span className="text-[10px] font-bold">{candidate.rating}</span>
                                        <Star className="h-3 w-3 fill-current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                );
                })}
            </div>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">إضافة مرشح جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1">الاسم</label><input type="text" required className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">الوظيفة</label>
                        <input list="job-list" type="text" required className="w-full border rounded p-2" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                        <datalist id="job-list">
                            {jobTitles.map(t => <option key={t.id} value={t.name} />)}
                        </datalist>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">الخبرة</label><input type="text" required className="w-full border rounded p-2" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">الهاتف</label><input type="text" className="w-full border rounded p-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                    <div><label className="block text-sm font-medium mb-1">البريد</label><input type="email" className="w-full border rounded p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select className="w-full border rounded p-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      {Object.values(ApplicationStatus).filter(s => s !== ApplicationStatus.HIRED).map((status) => (<option key={status} value={status}>{status}</option>))}
                    </select>
                </div>
                <div className="pt-4 flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700">حفظ</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border py-2 rounded hover:bg-gray-50">إلغاء</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Details Modal */}
      {isDetailModalOpen && selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-2xl">
                      <div className="flex gap-4">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 border-2 border-indigo-100 shadow-sm">
                              {selectedCandidate.name.charAt(0)}
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                              <p className="text-indigo-600 font-medium">{selectedCandidate.position}</p>
                              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {selectedCandidate.experience}</span>
                                  {selectedCandidate.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedCandidate.phone}</span>}
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                  </div>

                  <div className="flex border-b border-gray-200 px-6">
                      <button onClick={() => setDetailTab('profile')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${detailTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>الملف الشخصي</button>
                      <button onClick={() => setDetailTab('timeline')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${detailTab === 'timeline' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>المقابلات والملاحظات</button>
                      <button onClick={() => setDetailTab('scorecard')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${detailTab === 'scorecard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>التقييم</button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 bg-white">
                      {detailTab === 'profile' && (
                          <div className="space-y-6 animate-in fade-in">
                              <div className="grid grid-cols-2 gap-6">
                                  <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">البريد الإلكتروني</h4>
                                      <p className="text-gray-800">{selectedCandidate.email || '-'}</p>
                                  </div>
                                  <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">تاريخ التقديم</h4>
                                      <p className="text-gray-800">{selectedCandidate.appliedDate || new Date().toISOString().split('T')[0]}</p>
                                  </div>
                                  <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">الحالة الحالية</h4>
                                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold inline-block">{selectedCandidate.status}</span>
                                  </div>
                              </div>
                              
                              <div className="border-t border-gray-100 pt-4">
                                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> السيرة الذاتية</h4>
                                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                      <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm"><Paperclip className="h-5 w-5 text-gray-400" /></div>
                                      <p className="text-sm text-gray-500">لا يوجد ملف مرفق</p>
                                      <button className="text-indigo-600 text-xs font-bold hover:underline mt-1">رفع ملف PDF</button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {detailTab === 'timeline' && (
                          <div className="space-y-4 animate-in fade-in">
                              <div className="flex gap-4">
                                  <div className="flex-col items-center hidden sm:flex">
                                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">HR</div>
                                      <div className="w-px h-full bg-gray-200 my-1"></div>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1">
                                      <div className="flex justify-between mb-2">
                                          <span className="font-bold text-gray-800 text-sm">تم التقديم للوظيفة</span>
                                          <span className="text-xs text-gray-400">{selectedCandidate.appliedDate || 'Oct 20, 2023'}</span>
                                      </div>
                                      <p className="text-sm text-gray-600">قام المرشح بإرسال الطلب عبر الموقع.</p>
                                  </div>
                              </div>
                              <div className="flex gap-4">
                                  <div className="flex-col items-center hidden sm:flex">
                                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1">
                                      <h4 className="font-bold text-gray-800 mb-2">جدولة مقابلة</h4>
                                      <div className="flex gap-2">
                                          <input type="date" className="border rounded p-1.5 text-sm" />
                                          <input type="time" className="border rounded p-1.5 text-sm" />
                                          <button className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">حفظ الموعد</button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {detailTab === 'scorecard' && (
                          <div className="animate-in fade-in">
                              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6 flex items-center gap-3">
                                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                                  <div>
                                      <h4 className="font-bold text-yellow-800 text-lg">{selectedCandidate.rating} / 5</h4>
                                      <p className="text-xs text-yellow-700">التقييم العام الحالي</p>
                                  </div>
                              </div>
                              
                              <h4 className="font-bold text-gray-800 mb-3">تقييم المهارات</h4>
                              <div className="space-y-3">
                                  {['الخبرة الفنية', 'مهارات التواصل', 'حل المشكلات', 'الملاءمة الثقافية'].map(skill => (
                                      <div key={skill} className="flex items-center justify-between p-3 border rounded-lg">
                                          <span className="text-sm font-medium">{skill}</span>
                                          <div className="flex gap-1">
                                              {[1,2,3,4,5].map(s => (
                                                  <button key={s} className="text-gray-300 hover:text-yellow-400"><Star className="h-4 w-4 fill-current" /></button>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                      <button onClick={() => handleDeleteCandidate(selectedCandidate.id)} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><Trash2 className="h-4 w-4" /> حذف المرشح</button>
                      
                      <div className="flex gap-2">
                          <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 border bg-white rounded-lg text-sm font-medium hover:bg-gray-50">إغلاق</button>
                          {(selectedCandidate.status === ApplicationStatus.INTERVIEW || selectedCandidate.status === ApplicationStatus.OFFER) && (
                              <button onClick={() => handleHireCandidate(selectedCandidate)} className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2 shadow-sm">
                                  <UserPlus className="h-4 w-4" />
                                  تعيين كموظف
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Recruitment;
