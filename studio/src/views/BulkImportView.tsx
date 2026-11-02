import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  Upload
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';

interface ParsedVocabRow {
  spoken: string;
  written: string;
  pronunciation: string;
  category: string;
  myanmarMeaning: string;
  englishMeaning: string;
  exampleKorean: string;
  exampleMyanmar: string;
  valid: boolean;
  error?: string;
}

export function BulkImportView({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedVocabRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sampleTemplate = `그래서\t따라서\ttta-ra-seo\tCause & Effect\tထို့ကြောင့်\tTherefore\t인터넷 사용자가 급증했다.\tအင်တာနက် အသုံးပြုသူ များပြားလာသည်။
근데\t그러나\tgeu-reo-na\tContrast\tသို့သော်\tHowever\t스마트폰은 편리하다.\tစမတ်ဖုန်းသည် အဆင်ပြေသည်။
진짜\t실제로\tsil-je-ro\tEmphasis\tအမှန်တကယ်\tIn fact\t실제로 효과가 입증되었다.\tအမှန်တကယ် အကျိုးသက်ရောက်မှု သက်သေပြနိုင်ခဲ့သည်။
많이\t상당히\tsang-dang-hi\tDegree\tအတော်အတန်\tConsiderably\t상당히 큰 변화가 일어났다.\tအတော်အတန် ကြီးမားသော ပြောင်းလဲမှု ဖြစ်ပေါ်ခဲ့သည်။`;

  const parseInput = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split('\n');
    const results: ParsedVocabRow[] = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      // Split by tab (Excel/Sheets) or comma (CSV)
      const delimiter = line.includes('\t') ? '\t' : ',';
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

      // Expected columns: spoken, written, pronunciation, category, myanmarMeaning, englishMeaning, exampleKr, exampleMm
      const spoken = cols[0] || '';
      const written = cols[1] || '';
      const pronunciation = cols[2] || '';
      const category = cols[3] || 'General';
      const myanmarMeaning = cols[4] || '';
      const englishMeaning = cols[5] || '';
      const exampleKorean = cols[6] || '';
      const exampleMyanmar = cols[7] || '';

      // Skip header row if user copied headers from Excel
      if (
        idx === 0 &&
        (spoken.toLowerCase().includes('spoken') ||
          spoken.includes('စကားပြော') ||
          written.toLowerCase().includes('academic') ||
          written.includes('စာရေး'))
      ) {
        return;
      }

      const isValid = Boolean(spoken && written && myanmarMeaning);
      results.push({
        spoken,
        written,
        pronunciation,
        category,
        myanmarMeaning,
        englishMeaning,
        exampleKorean,
        exampleMyanmar,
        valid: isValid,
        error: !isValid ? 'Missing spoken, written, or Myanmar meaning' : undefined,
      });
    });

    setParsedRows(results);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Spoken Word (စကားပြော)',
      'Academic Word (စာရေး/TOPIK)',
      'Pronunciation (အသံထွက်)',
      'Category (အုပ်စု)',
      'Myanmar Meaning (မြန်မာအဓိပ္ပာယ်)',
      'English Meaning (အင်္ဂလိပ်အဓိပ္ပာယ်)',
      'Korean Example (နမူနာဝါကျ)',
      'Myanmar Example (မြန်မာဘာသာပြန်)',
    ];

    const sampleRows = [
      ['그래서', '따라서', 'tta-ra-seo', 'Cause & Effect', 'ထို့ကြောင့်', 'Therefore', '인터넷 사용자가 급증했다.', 'အင်တာနက် အသုံးပြုသူ များပြားလာသည်။'],
      ['근데', '그러나', 'geu-reo-na', 'Contrast', 'သို့သော်', 'However', '스마트폰은 편리하다.', 'စမတ်ဖုန်းသည် အဆင်ပြေသည်။'],
      ['진짜', '실제로', 'sil-je-ro', 'Emphasis', 'အမှန်တကယ်', 'In fact', '실제로 효과가 입증되었다.', 'အမှန်တကယ် အကျိုးသက်ရောက်မှု သက်သေပြနိုင်ခဲ့သည်။'],
      ['많이', '상당히', 'sang-dang-hi', 'Degree', 'အတော်အတန်', 'Considerably', '상당히 큰 변화가 일어났다.', 'အတော်အတန် ကြီးမားသော ပြောင်းလဲမှု ဖြစ်ပေါ်ခဲ့သည်။'],
      ['생각하다', '간주하다', 'gan-ju-ha-da', 'Academic Action', 'သတ်မှတ်ယူဆသည်', 'Consider / Regard', '이를 심각한 문제로 간주한다.', 'ယင်းကို ကြီးလေးသော ပြဿနာအဖြစ် သတ်မှတ်ယူဆကြသည်။'],
    ];

    const formatCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(formatCell).join(','),
      ...sampleRows.map((row) => row.map(formatCell).join(',')),
    ].join('\r\n');

    // \uFEFF BOM ensures Microsoft Excel & Google Sheets open UTF-8 (Korean + Myanmar) without garbled text
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'vocabjip_topik_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseInput(content);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleBulkUpload = async (status: 'pending_review' | 'approved') => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setErrorMessage('တင်သွင်းရန် မှန်ကန်သော စကားလုံး အတန်းများ မရှိသေးပါခင်ဗျာ။');
      return;
    }

    setImporting(true);
    setErrorMessage(null);
    setSuccessCount(null);

    try {
      const records = validRows.map((row, idx) => ({
        id: `v-bulk-${Date.now().toString(36)}-${idx}`,
        spoken: row.spoken,
        written: row.written,
        pronunciation: row.pronunciation,
        category: row.category,
        myanmar_meaning: row.myanmarMeaning,
        english_meaning: row.englishMeaning,
        usage_tip: `TOPIK II စာစီစာကုံးသုံး ဝေါဟာရ: '${row.written}'`,
        example_korean: row.exampleKorean,
        example_myanmar: row.exampleMyanmar,
        status,
        created_by: user?.id || null,
        reviewed_by: status === 'approved' ? user?.id : null,
      }));

      const { error } = await supabase.from('vocabularies').insert(records);
      if (error) throw error;

      setSuccessCount(records.length);
      setRawText('');
      setParsedRows([]);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during bulk upload');
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bulk Excel / CSV Import</h1>
          <p className="text-sm text-slate-500 mt-1">
            Google Sheets သို့မဟုတ် Excel ဖိုင်မှ စကားလုံးရာပေါင်းများစွာကို ကော်ပီကူးထည့်ရုံဖြင့် တစ်ခါတည်း အများအပြား တင်သွင်းနိုင်ပါသည်
          </p>
        </div>

        {/* Download & Upload Template Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition">
            <Download className="w-4 h-4" />
            <span>Download Excel Template (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Upload File (.csv)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {successCount !== null && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">
            🎉 စကားလုံးပေါင်း {successCount} လုံးကို အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ! Admin မှ စစ်ဆေးအတည်ပြုပြီးပါက မိုဘိုင်း App သို့ တိုက်ရိုက် ရောက်ရှိသွားပါမည်။
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Guide & Format info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / Google Sheets Column Format</span>
          </div>

          <button
            type="button"
            onClick={() => parseInput(sampleTemplate)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Text Preview</span>
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Column 8 ခု အစီအစဉ်အတိုင်း Excel သို့မဟုတ် Google Sheets တွင် ဖြည့်သွင်းပါ-</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">1. Spoken Word (e.g. 그래서)</div>
            <div className="p-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 font-bold">2. Academic Word (따라서)</div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">3. Pronunciation (tta-ra-seo)</div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">4. Category (Cause & Effect)</div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">5. Myanmar Meaning (ထို့ကြောင့်)</div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">6. English Meaning (Therefore)</div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">7. Korean Example (Sentence)</div>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">8. Myanmar Example (Translation)</div>
          </div>
        </div>

        {/* Textarea Paste */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
            <span>Paste Excel Rows / CSV Text here (ကော်ပီကူးထားသည်များကို ဤနေရာတွင် Paste လုပ်ပါ):</span>
            <span className="text-[11px] text-slate-400 font-normal">Excel / Sheets မှ ကူးထားသော Cells များကို တိုက်ရိုက် Paste ချနိုင်ပါသည်</span>
          </label>
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => parseInput(e.target.value)}
            placeholder="Excel သို့မဟုတ် Google Sheets မှ Cells များကို Select လုပ်ပြီး Copy ကူး၍ Paste ချလိုက်ပါ (သို့မဟုတ် အပေါ်မှ .csv ဖိုင် Upload လုပ်ပါ)..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
          />
        </div>
      </div>

      {/* Live Parsed Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">Parsed Table Preview ({parsedRows.length} rows)</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {validCount} Valid
              </span>
              {invalidCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  {invalidCount} Incomplete
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={importing || validCount === 0}
                onClick={() => handleBulkUpload('pending_review')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50">
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Submit to Admin Review ({validCount} words)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Spoken</th>
                  <th className="py-2.5 px-3 text-blue-700">Academic Word</th>
                  <th className="py-2.5 px-3">Pronunciation</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Myanmar Meaning</th>
                  <th className="py-2.5 px-3">English</th>
                  <th className="py-2.5 px-3">Korean Example</th>
                  <th className="py-2.5 px-3">Myanmar Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {parsedRows.map((r, i) => (
                  <tr key={i} className={r.valid ? 'hover:bg-slate-50/70' : 'bg-red-50/30'}>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                    <td className="py-2.5 px-3">
                      {r.valid ? (
                        <span className="text-emerald-600 font-bold">✓ Ready</span>
                      ) : (
                        <span className="text-red-600 font-semibold">{r.error}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 line-through">{r.spoken}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.written}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{r.pronunciation}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.category}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.myanmarMeaning}</td>
                    <td className="py-2.5 px-3 text-slate-500">{r.englishMeaning}</td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">{r.exampleKorean}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{r.exampleMyanmar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
