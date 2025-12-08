
import React, { useState, useEffect } from 'react';
import { MOCK_SHIFTS } from '../constants';
import { Shift } from '../types';
import { Plus, X, Clock, CalendarDays, Trash2, Edit } from 'lucide-react';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('shifts_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_SHIFTS : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  
  const [shiftForm, setShiftForm] = useState<Partial<Shift>>({
    name: '',
    startTime: '',
    endTime: '',
    days: []
  });

  const allDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  useEffect(() => {
    localStorage.setItem('shifts_data', JSON.stringify(shifts));
  }, [shifts]);

  const handleOpenModal = (shift?: Shift) => {
    if (shift) {
      setEditingShiftId(shift.id);
      setShiftForm(shift);
    } else {
      setEditingShiftId(null);
      setShiftForm({ name: '', startTime: '08:00', endTime: '16:00', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] });
    }
    setIsModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    if (editingShiftId) {
      setShifts(prev => prev.map(s => s.id === editingShiftId ? { ...s, ...shiftForm } as Shift : s));
    } else {
      const newShift: Shift = {
        id: `SH-${Date.now()}`,
        name: shiftForm.name!,
        startTime: shiftForm.startTime!,
        endTime: shiftForm.endTime!,
        days: shiftForm.days || []
      };
      setShifts([...shifts, newShift]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteShift = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الوردية؟')) {
      setShifts(shifts.filter(s => s.id !== id));
    }
  };

  const toggleDay = (day: string) => {
    setShiftForm(prev => {
      const currentDays = prev.days || [];
      if (currentDays.includes(day)) {
        return { ...prev, days: currentDays.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...currentDays, day] };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الورديات</h2>
          <p className="text-sm text-gray-500">تعريف مواعيد العمل الرسمية وأيام الإجازات</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5" />
          <span>إضافة وردية</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-800">{shift.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(shift)} className="text-gray-400 hover:text-indigo-600 p-1"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteShift(shift.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
               <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span className="font-mono">{shift.startTime}</span>
               </div>
               <span>إلى</span>
               <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-mono">{shift.endTime}</span>
               </div>
            </div>

            <div className="space-y-2">
               <p className="text-xs text-gray-500 font-medium">أيام العمل:</p>
               <div className="flex flex-wrap gap-1.5">
                  {shift.days.map((day, idx) => (
                     <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-100">{day}</span>
                  ))}
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                    {editingShiftId ? 'تعديل وردية' : 'إضافة وردية جديدة'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition">
                    <X className="h-6 w-6" />
                 </button>
              </div>
              
              <form onSubmit={handleSaveShift} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الوردية</label>
                    <input 
                       type="text" required 
                       className="w-full p-2 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                       placeholder="مثال: الوردية الصباحية"
                       value={shiftForm.name}
                       onChange={(e) => setShiftForm({...shiftForm, name: e.target.value})}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">وقت الحضور</label>
                       <input 
                          type="time" required 
                          className="w-full p-2 rounded-lg border border-gray-300 text-center"
                          value={shiftForm.startTime}
                          onChange={(e) => setShiftForm({...shiftForm, startTime: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">وقت الانصراف</label>
                       <input 
                          type="time" required 
                          className="w-full p-2 rounded-lg border border-gray-300 text-center"
                          value={shiftForm.endTime}
                          onChange={(e) => setShiftForm({...shiftForm, endTime: e.target.value})}
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">أيام العمل</label>
                    <div className="flex flex-wrap gap-2">
                       {allDays.map(day => (
                          <button
                             type="button"
                             key={day}
                             onClick={() => toggleDay(day)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                shiftForm.days?.includes(day)
                                   ? 'bg-indigo-600 text-white border-indigo-600'
                                   : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                             }`}
                          >
                             {day}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium">حفظ</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium">إلغاء</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
