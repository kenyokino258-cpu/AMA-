
import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldAlert, Loader2 } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);

  // Optimized Export: Using timeout to unblock UI and more efficient string building
  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    setIsProcessing(true);

    // Yield control to UI thread to show spinner
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        // Determine headers
        const cols = headers 
          ? headers.map(h => h.key) 
          : Object.keys(data[0]) as (keyof T)[];
        
        const headerLabels = headers 
          ? headers.map(h => h.label) 
          : cols;

        // Build CSV Content
        // Using map and join is generally faster than += in loops for V8
        const csvRows = [
          headerLabels.join(',')
        ];

        // Process in chunks if data is huge, otherwise simple map
        const bodyRows = data.map(row => 
            cols.map(col => {
              const val = row[col];
              // Escape quotes and wrap in quotes to handle commas in data
              const escaped = ('' + (val ?? '')).replace(/"/g, '""');
              return `"${escaped}"`;
            }).join(',')
        );

        const csvString = '\uFEFF' + csvRows.concat(bodyRows).join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Export failed", error);
        alert('حدث خطأ أثناء التصدير');
    } finally {
        setIsProcessing(false);
    }
  };

  // Optimized Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        // Yield to main thread before heavy parsing
        await new Promise(resolve => setTimeout(resolve, 50));

        const lines = text.split('\n');
        // Filter empty lines early
        const validLines = lines.filter(l => l.trim().length > 0);
        
        if (validLines.length < 2) throw new Error("File empty or invalid format");

        const headerLine = validLines[0];
        const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        const result = validLines.slice(1).map(line => {
          // Robust regex for CSV splitting including quoted commas
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => 
            val.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
          );
          
          const obj: any = {};
          headers.forEach((header, index) => {
             if (values[index] !== undefined) {
                 obj[header] = values[index];
             }
          });
          return obj as T;
        });

        if (onImport) {
          onImport(result);
          alert(`تم استيراد ${result.length} سجل بنجاح`);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من صحة التنسيق (CSV).');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
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
        disabled={isProcessing}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-wait"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span className="hidden sm:inline">استيراد</span>
      </button>

      <button 
        onClick={handleExport}
        disabled={isProcessing}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-wait"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span className="hidden sm:inline">تصدير Excel</span>
      </button>
    </div>
  );
};

export default DataControls;
