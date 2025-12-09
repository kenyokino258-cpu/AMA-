
import React, { useRef } from 'react';
import { Download, Upload, ShieldAlert } from 'lucide-react';

interface DataControlsProps<T> {
  data: T[];
  onImport?: (data: T[]) => void;
  fileName: string;
  isAdmin: boolean;
  headers?: { key: keyof T; label: string }[];
}

const DataControls = <T extends object>({ 
  data, 
  onImport, 
  fileName, 
  isAdmin,
  headers 
}: DataControlsProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to convert JSON to CSV with BOM for Arabic support
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Determine headers from data keys if not provided
    const cols = headers 
      ? headers.map(h => h.key) 
      : Object.keys(data[0]) as (keyof T)[];
    
    const headerLabels = headers 
      ? headers.map(h => h.label) 
      : cols;

    // Create CSV content
    const csvRows = [
      headerLabels.join(','), // Header row
      ...data.map(row => 
        cols.map(col => {
          const val = row[col];
          // Escape quotes and wrap in quotes to handle commas in data
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    // Add BOM for Excel to read Arabic correctly
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Basic CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        const result = lines.slice(1).filter(l => l.trim()).map(line => {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => 
            val.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
          );
          
          return headers.reduce((obj, header, index) => {
            // @ts-ignore
            obj[header] = values[index];
            // @ts-ignore
            // Try to map back to original keys if headers prop was used (simple reverse mapping logic would be needed here for robust apps)
             return obj;
          }, {} as T);
        });

        if (onImport) {
          onImport(result);
          alert('تم استيراد البيانات بنجاح (محاكاة)');
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من صحة التنسيق.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200" title="مطلوب صلاحية مدير">
        <ShieldAlert className="h-3 w-3" />
        <span>التحكم في البيانات مقيد</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input 
        type="file" 
        accept=".csv,.xlsx" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">استيراد</span>
      </button>

      <button 
        onClick={handleExport}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">تصدير Excel</span>
      </button>
    </div>
  );
};

export default DataControls;
