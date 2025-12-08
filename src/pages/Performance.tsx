
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_PERFORMANCE_REVIEWS, MOCK_EMPLOYEES } from '../constants';
import { PerformanceReview, KPI, Employee, UserRole } from '../types';
import { Plus, Search, Star, Award, Trash2, Edit, Save, X, CheckCircle, BarChart3 } from 'lucide-react';
import DataControls from '../components/DataControls';
import { AppContext } from '../App';

const Performance: React.FC = () => {
  const { currentUser, addNotification } = useContext(AppContext);
  const [reviews, setReviews] = useState<PerformanceReview[]>(() => {
    const saved = localStorage.getItem('performance_data');
    return saved ? JSON.parse(saved) : MOCK_PERFORMANCE_REVIEWS;
  });

  const [employees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees_data');
    return saved ? JSON.parse(saved) : MOCK_EMPLOYEES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentReview, setCurrentReview] = useState<Partial<PerformanceReview>>({
    kpis: []
  });

  useEffect(() => {
    localStorage.setItem('performance_data', JSON.stringify(reviews));
  }, [reviews]);

  const handleOpenModal = (review?: PerformanceReview) => {
    if (review) {
      setCurrentReview(review);
    } else {
      setCurrentReview({
        id: `PR-${Date.now()}`,
        period: `Q${Math.floor((new Date().getMonth() + 3) / 3)} ${new Date().getFullYear()}`,
        kpis: [
            { id: `K-${Date.now()}-1`, name: 'جودة العمل', targetValue: 100, actualValue: 0, weight: 40, score: 0, unit: '%' },
            { id: `K-${Date.now()}-2`, name: 'الانضباط والالتزام', targetValue: 10, actualValue: 0, weight: 30, score: 0, unit: 'Rating' },
            { id: `K-${Date.now()}-3`, name: 'العمل الجماعي', targetValue: 10, actualValue: 0, weight: 30, score: 0, unit: 'Rating' }
        ],
        status: 'draft',
        totalScore: 0,
        evaluationDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleUpdateKPI = (kpiId: string, field: keyof KPI, value: any) => {
    const updatedKPIs = currentReview.kpis?.map(k => {
      if (k.id === kpiId) {
        const updated = { ...k, [field]: value };
        // Recalculate score: (Actual / Target) * Weight
        if (field === 'actualValue' || field === 'targetValue' || field === 'weight') {
            const actual = field === 'actualValue' ? Number(value) : k.actualValue;
            const target = field === 'targetValue' ? Number(value) : k.targetValue;
            const weight = field === 'weight' ? Number(value) : k.weight;
            updated.score = target > 0 ? Math.min((actual / target) * weight, weight) : 0;
        }
        return updated;
      }
      return k;
    });

    const total = updatedKPIs?.reduce((acc, curr) => acc + curr.score, 0) || 0;
    setCurrentReview(prev => ({ ...prev, kpis: updatedKPIs, totalScore: Math.round(total) }));
  };

  const handleSaveReview = () => {
    if (!currentReview.employeeId) {
        alert('الرجاء اختيار موظف');
        return;
    }
    
    // Find employee name if not set
    const empName = employees.find(e => e.id === currentReview.employeeId)?.name;
    const finalReview = { ...currentReview, employeeName: empName || '' } as PerformanceReview;

    if (reviews.find(r => r.id === finalReview.id)) {
        setReviews(prev => prev.map(r => r.id === finalReview.id ? finalReview : r));
    } else {
        setReviews(prev => [...prev, finalReview]);
    }
    
    setIsModalOpen(false);
    addNotification('تقييم أداء', `تم حفظ تقييم الأداء للموظف ${finalReview.employeeName}`);
  };

  const handleDelete = (id: string) => {
      if(window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
          setReviews(prev => prev.filter(r => r.id !== id));
      }
  };

  const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600 bg-green-50';
      if (score >= 75) return 'text-indigo-600 bg-indigo-50';
      if (score >= 50) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الأداء والتقييم</h2>
          <p className="text-sm text-gray-500 mt-1">متابعة مؤشرات الأداء (KPIs) وتقييم الموظفين</p>
        </div>
        <div className="flex gap-3">
          <DataControls data={reviews} fileName="performance_reviews" isAdmin={true} />
          {currentUser?.role !== UserRole.EMPLOYEE && (
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95"
            >
                <Plus className="h-5 w-5" />
                <span>تقييم جديد</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm">متوسط أداء الشركة</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                      {reviews.length > 0 ? Math.round(reviews.reduce((a,b) => a + b.totalScore, 0) / reviews.length) : 0}%
                  </h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                  <BarChart3 className="h-8 w-8" />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm">أعلى تقييم (هذا الربع)</p>
                  <h3 className="text-3xl font-bold text-green-600 mt-2">
                      {reviews.length > 0 ? Math.max(...reviews.map(r => r.totalScore)) : 0}%
                  </h3>
              </div>
              <div className="bg-green-50 p-3 rounded-full text-green-600">
                  <Award className="h-8 w-8" />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm">إجمالي التقييمات</p>
                  <h3 className="text-3xl font-bold text-indigo-600 mt-2">{reviews.length}</h3>
              </div>
              <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                  <Star className="h-8 w-8" />
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative w-full max-w-md">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="بحث باسم الموظف..." 
                    className="w-full rounded-lg border border-gray-200 py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
         </div>
         <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                    <th className="px-6 py-4">الموظف</th>
                    <th className="px-6 py-4">الفترة</th>
                    <th className="px-6 py-4">تاريخ التقييم</th>
                    <th className="px-6 py-4">النتيجة النهائية</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">إجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {reviews.filter(r => r.employeeName.toLowerCase().includes(searchTerm.toLowerCase())).map(review => (
                    <tr key={review.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{review.employeeName}</td>
                        <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{review.period}</span></td>
                        <td className="px-6 py-4 font-mono text-gray-500">{review.evaluationDate}</td>
                        <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${getScoreColor(review.totalScore)}`}>
                                {review.totalScore}%
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {review.status === 'approved' 
                                ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> معتمد</span>
                                : <span className="text-yellow-600 flex items-center gap-1"> مسودة</span>}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => handleOpenModal(review)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800">تقييم أداء موظف</h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                              <label className="block text-sm font-medium mb-1">الموظف</label>
                              <select 
                                className="w-full border rounded p-2"
                                value={currentReview.employeeId || ''}
                                onChange={e => setCurrentReview({...currentReview, employeeId: e.target.value})}
                                disabled={!!currentReview.id && reviews.some(r => r.id === currentReview.id)}
                              >
                                  <option value="">اختر موظف...</option>
                                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">فترة التقييم</label>
                              <input 
                                type="text" 
                                className="w-full border rounded p-2" 
                                value={currentReview.period}
                                onChange={e => setCurrentReview({...currentReview, period: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="mb-4">
                          <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">مؤشرات الأداء (KPIs)</h4>
                          <table className="w-full text-sm text-right">
                              <thead className="bg-gray-50 text-gray-500">
                                  <tr>
                                      <th className="p-2">المؤشر</th>
                                      <th className="p-2 w-20">المستهدف</th>
                                      <th className="p-2 w-20">الفعلي</th>
                                      <th className="p-2 w-20">الوزن %</th>
                                      <th className="p-2 w-20">الدرجة</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {currentReview.kpis?.map((kpi, idx) => (
                                      <tr key={idx} className="border-b">
                                          <td className="p-2">
                                              <input className="w-full border-none bg-transparent focus:ring-0" value={kpi.name} onChange={e => handleUpdateKPI(kpi.id, 'name', e.target.value)} />
                                          </td>
                                          <td className="p-2">
                                              <input type="number" className="w-full border rounded p-1 text-center" value={kpi.targetValue} onChange={e => handleUpdateKPI(kpi.id, 'targetValue', e.target.value)} />
                                          </td>
                                          <td className="p-2">
                                              <input type="number" className="w-full border rounded p-1 text-center bg-indigo-50" value={kpi.actualValue} onChange={e => handleUpdateKPI(kpi.id, 'actualValue', e.target.value)} />
                                          </td>
                                          <td className="p-2">
                                              <input type="number" className="w-full border rounded p-1 text-center" value={kpi.weight} onChange={e => handleUpdateKPI(kpi.id, 'weight', e.target.value)} />
                                          </td>
                                          <td className="p-2 text-center font-bold text-indigo-700">{kpi.score.toFixed(1)}</td>
                                      </tr>
                                  ))}
                              </tbody>
                              <tfoot className="bg-gray-50 font-bold">
                                  <tr>
                                      <td colSpan={4} className="p-2 text-left">النتيجة النهائية</td>
                                      <td className="p-2 text-center text-lg">{currentReview.totalScore}</td>
                                  </tr>
                              </tfoot>
                          </table>
                      </div>

                      <div>
                          <label className="block text-sm font-medium mb-1">ملاحظات عامة</label>
                          <textarea 
                            className="w-full border rounded p-2" 
                            rows={3}
                            value={currentReview.feedback || ''}
                            onChange={e => setCurrentReview({...currentReview, feedback: e.target.value})}
                          ></textarea>
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded bg-white hover:bg-gray-50">إلغاء</button>
                      <button onClick={handleSaveReview} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2">
                          <Save className="h-4 w-4" /> حفظ التقييم
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Performance;
