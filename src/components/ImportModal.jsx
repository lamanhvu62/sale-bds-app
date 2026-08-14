import { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../services/supabase';

// Map tên cột tiếng Việt → field trong database
const FIELD_MAP = {
  'tên': 'ten',
  'ten': 'ten',
  'họ tên': 'ten',
  'ho ten': 'ten',
  'họ và tên': 'ten',
  'ho va ten': 'ten',
  'name': 'ten',
  'khách hàng': 'ten',
  'khach hang': 'ten',

  'sđt': 'sdt',
  'sdt': 'sdt',
  'số điện thoại': 'sdt',
  'so dien thoai': 'sdt',
  'điện thoại': 'sdt',
  'dien thoai': 'sdt',
  'phone': 'sdt',
  'mobile': 'sdt',
  'tel': 'sdt',

  'nhu cầu': 'nhu_cau',
  'nhu cau': 'nhu_cau',
  'need': 'nhu_cau',

  'ngân sách': 'ngan_sach',
  'ngan sach': 'ngan_sach',
  'budget': 'ngan_sach',
  'khoảng giá': 'ngan_sach',
  'khoang gia': 'ngan_sach',

  'khu vực': 'khu_vuc',
  'khu vuc': 'khu_vuc',
  'area': 'khu_vuc',
  'địa bàn': 'khu_vuc',
  'dia ban': 'khu_vuc',

  'nguồn': 'nguon',
  'nguon': 'nguon',
  'source': 'nguon',
  'kênh': 'nguon',
  'kenh': 'nguon',

  'ghi chú': 'ghi_chu',
  'ghi chu': 'ghi_chu',
  'note': 'ghi_chu',
  'notes': 'ghi_chu',
  'chú thích': 'ghi_chu',
  'chu thich': 'ghi_chu',
};

const TRANG_THAI_MAP = {
  'tiềm năng': 'tiem-nang',
  'tiem nang': 'tiem-nang',
  'đang chăm': 'dang-cham',
  'dang cham': 'dang-cham',
  'sắp chốt': 'sap-chot',
  'sap chot': 'sap-chot',
  'đã mua': 'da-mua',
  'da mua': 'da-mua',
  'không nhu cầu': 'khong-nhu-cau',
  'khong nhu cau': 'khong-nhu-cau',
};

export default function ImportModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map columns, 3: Preview, 4: Importing
  const [columns, setColumns] = useState([]); // Cột trong file
  const [previewData, setPreviewData] = useState([]); // 5 dòng đầu
  const [allData, setAllData] = useState([]); // Toàn bộ data
  const [columnMapping, setColumnMapping] = useState({}); // Map cột file → field DB
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Danh sách field có thể map
  const availableFields = [
    { key: 'ten', label: 'Tên khách hàng', required: true },
    { key: 'sdt', label: 'Số điện thoại', required: true },
    { key: 'nhu_cau', label: 'Nhu cầu', required: false },
    { key: 'ngan_sach', label: 'Ngân sách', required: false },
    { key: 'khu_vuc', label: 'Khu vực', required: false },
    { key: 'nguon', label: 'Nguồn', required: false },
    { key: 'ghi_chu', label: 'Ghi chú', required: false },
    { key: 'trang_thai', label: 'Trạng thái', required: false },
  ];

  // Kiểm tra đã map đủ 2 field bắt buộc chưa
  const hasRequiredFields = () => {
    const values = Object.values(columnMapping);
    return values.includes('ten') && values.includes('sdt');
  };

  // Xử lý khi chọn file
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    // Kiểm tra định dạng
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(ext)) {
      alert('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV');
      return;
    }

    // Đọc file
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (jsonData.length < 2) {
        alert('File không có dữ liệu hoặc chỉ có 1 dòng!');
        return;
      }

      // Dòng đầu là header
      const headers = jsonData[0].map(h => String(h || '').trim());
      setColumns(headers);

      // Parse data (bỏ dòng header)
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
      const parsedRows = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
        });
        return obj;
      });

      setAllData(parsedRows);
      setPreviewData(parsedRows.slice(0, 5)); // 5 dòng preview

      // Auto-map columns
      const autoMapping = {};
      headers.forEach(header => {
        const normalized = header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const [pattern, field] of Object.entries(FIELD_MAP)) {
          if (normalized.includes(pattern)) {
            autoMapping[header] = field;
            break;
          }
        }
      });
      setColumnMapping(autoMapping);
      setStep(2);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  // Bắt đầu import
  const handleImport = async () => {
    if (!hasRequiredFields()) {
      alert('Vui lòng map cột "Tên khách hàng" và "Số điện thoại"!');
      return;
    }

    setStep(4);
    setImporting(true);

    const { data: { user } } = await supabase.auth.getUser();
    let success = 0;
    let failed = 0;
    const errors = [];

    // Tìm tên cột tương ứng với field 'ten' và 'sdt'
    const tenCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'ten');
    const sdtCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'sdt');

    for (const row of allData) {
      try {
        const khachData = {
          ten: row[tenCol] || '',
          sdt: row[sdtCol] || '',
          nhu_cau: '',
          ngan_sach: '',
          khu_vuc: '',
          nguon: '',
          ghi_chu: '',
          trang_thai: 'tiem-nang',
          user_id: user.id,
          last_contacted_at: new Date().toISOString(),
        };

        // Map các field không bắt buộc
        for (const [col, field] of Object.entries(columnMapping)) {
          if (field === 'ten' || field === 'sdt') continue;
          if (field === 'trang_thai') {
            const rawValue = (row[col] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            khachData.trang_thai = TRANG_THAI_MAP[rawValue] || 'tiem-nang';
          } else {
            khachData[field] = row[col] || '';
          }
        }

        // Bỏ qua dòng trống tên hoặc SĐT
        if (!khachData.ten || !khachData.sdt) {
          failed++;
          errors.push(`Dòng thiếu tên/SĐT: ${JSON.stringify(row)}`);
          continue;
        }

        const { error } = await supabase.from('khach_hang').insert([khachData]);
        if (error) {
          failed++;
          errors.push(`${khachData.ten}: ${error.message}`);
        } else {
          success++;
        }
      } catch (err) {
        failed++;
        errors.push(`Lỗi: ${err.message}`);
      }
    }

    setImporting(false);
    setImportResult({ success, failed, errors });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-800">Import khách hàng</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step > s ? 'bg-emerald-500 text-white' :
                  step === s ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* === STEP 1: Upload file === */}
          {step === 1 && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
                }`}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              <Upload className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-emerald-500' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600 font-medium mb-1">
                {dragOver ? 'Thả file vào đây!' : 'Kéo thả file Excel/CSV vào đây'}
              </p>
              <p className="text-xs text-gray-400">hoặc bấm để chọn file</p>
              <p className="text-xs text-gray-300 mt-3">Hỗ trợ: .xlsx, .xls, .csv</p>
            </div>
          )}

          {/* === STEP 2: Map columns === */}
          {step === 2 && (
            <>
              <div className="bg-emerald-50 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-800">
                  <p className="font-medium mb-1">Đã tìm thấy {allData.length} dòng dữ liệu</p>
                  <p className="text-emerald-700">
                    File của bạn có {columns.length} cột: <strong>{columns.filter(c => c).join(', ')}</strong>
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-2">
                Map cột dữ liệu <span className="text-red-500">*</span> = bắt buộc
              </p>

              <div className="space-y-2 mb-4">
                {availableFields.map(field => {
                  const mappedCol = Object.keys(columnMapping).find(col => columnMapping[col] === field.key) || '';
                  const isMapped = !!mappedCol;

                  return (
                    <div key={field.key} className={`flex items-center gap-3 p-2 rounded-lg ${field.required && !isMapped ? 'bg-red-50' : isMapped ? 'bg-emerald-50' : ''}`}>
                      <div className="w-32 flex-shrink-0">
                        <span className="text-sm text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <select
                        value={mappedCol}
                        onChange={(e) => {
                          const newMapping = { ...columnMapping };
                          // Xóa map cũ của field này
                          Object.keys(newMapping).forEach(col => {
                            if (newMapping[col] === field.key) delete newMapping[col];
                          });
                          // Set map mới
                          if (e.target.value) {
                            newMapping[e.target.value] = field.key;
                          }
                          setColumnMapping(newMapping);
                        }}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${field.required && !isMapped ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      >
                        <option value="">-- Chọn cột --</option>
                        {columns.filter(c => c).map(col => {
                          const otherField = columnMapping[col];
                          const otherLabel = otherField && otherField !== field.key
                            ? availableFields.find(af => af.key === otherField)?.label
                            : null;
                          return (
                            <option key={col} value={col}>
                              {col || '(cột trống)'}
                              {otherLabel ? ` (đã map → ${otherLabel})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      {/* Indicator */}
                      {field.required && !isMapped && (
                        <span className="text-red-500 text-xs flex-shrink-0">⚠️</span>
                      )}
                      {isMapped && (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hiển thị các cột chưa được map */}
              {columns.filter(c => c && !Object.keys(columnMapping).includes(c)).length > 0 && (
                <details className="mb-4 text-sm">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                    📋 {columns.filter(c => c && !Object.keys(columnMapping).includes(c)).length} cột chưa được map (bấm để xem)
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {columns.filter(c => c && !Object.keys(columnMapping).includes(c)).map(col => (
                      <span key={col} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                        "{col}"
                      </span>
                    ))}
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  ← Chọn lại file
                </button>
                <button
                  onClick={() => {
                    if (!hasRequiredFields()) {
                      const missing = [];
                      if (!Object.values(columnMapping).includes('ten')) missing.push('"Tên khách hàng"');
                      if (!Object.values(columnMapping).includes('sdt')) missing.push('"Số điện thoại"');
                      alert(`Vui lòng map các cột bắt buộc: ${missing.join(' và ')}`);
                      return;
                    }
                    setStep(3);
                  }}
                  disabled={!hasRequiredFields()}
                  className={`flex-[2] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${hasRequiredFields()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {hasRequiredFields()
                    ? `👀 Xem preview (${allData.length} dòng)`
                    : '⚠️ Cần map Tên + SĐT trước'}
                </button>
              </div>
            </>
          )}

          {/* === STEP 3: Preview === */}
          {step === 3 && (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Preview 5 dòng đầu tiên. Tổng cộng <strong>{allData.length}</strong> dòng sẽ được import.
              </p>

              <div className="overflow-x-auto mb-4 border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tên</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SĐT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nhu cầu</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ngân sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.map((row, index) => {
                      const tenCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'ten');
                      const sdtCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'sdt');
                      const nhuCauCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'nhu_cau');
                      const nganSachCol = Object.keys(columnMapping).find(col => columnMapping[col] === 'ngan_sach');

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                          <td className="px-3 py-2 font-medium">{tenCol ? row[tenCol] : '-'}</td>
                          <td className="px-3 py-2">{sdtCol ? row[sdtCol] : '-'}</td>
                          <td className="px-3 py-2 text-gray-500">{nhuCauCol ? row[nhuCauCol] || '-' : '-'}</td>
                          <td className="px-3 py-2 text-gray-500">{nganSachCol ? row[nganSachCol] || '-' : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleImport}
                  className="flex-[2] px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  🚀 Import {allData.length} khách hàng
                </button>
              </div>
            </>
          )}

          {/* === STEP 4: Importing / Result === */}
          {step === 4 && (
            <>
              {importing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Đang import...</p>
                  <p className="text-sm text-gray-400 mt-1">Đang xử lý {allData.length} khách hàng</p>
                </div>
              ) : importResult && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Import hoàn tất!</h3>
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{importResult.success}</p>
                      <p className="text-xs text-gray-500">Thành công</p>
                    </div>
                    {importResult.failed > 0 && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{importResult.failed}</p>
                        <p className="text-xs text-gray-500">Thất bại</p>
                      </div>
                    )}
                  </div>

                  {importResult.errors.length > 0 && (
                    <details className="text-left mb-4">
                      <summary className="text-sm text-red-600 cursor-pointer hover:underline">
                        Xem {importResult.errors.length} lỗi
                      </summary>
                      <div className="mt-2 max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-xs text-red-700 mb-1">{i + 1}. {err}</p>
                        ))}
                      </div>
                    </details>
                  )}

                  <button
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700"
                  >
                    ✅ Xong
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}