import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight, Loader2 } from 'lucide-react';

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

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedVocabRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sampleTemplate = `그래서\t따라서\ttta-ra-seo\tCause & Effect\tထို့ကြောင့်\tTherefore\t인터넷 사용자가 급증했다.\tအင်တာနက် အသုံးပြုသူ များပြားလာသည်။
근데\t그러나\tgeu-reo-na\tContrast\tသို့သော်\tHowever\t스마트폰은 편리하다.\tစမတ်ဖုန်းသည် အဆင်ပြေသည်။`;

  const parseInput = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split('\n');
    const results: ParsedVocabRow[] = [];

    lines.forEach((line) => {
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
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bulk Excel / CSV Import</h1>
        <p className="text-sm text-slate-500 mt-1">
          Google Sheets သို့မဟုတ် Excel ဖိုင်မှ စကားလုံးရာပေါင်းများစွာကို ကော်ပီကူးထည့်ရုံဖြင့် တစ်ခါတည်း အများအပြား တင်သွင်းနိုင်ပါသည်
        </p>
      </div>

      {successCount !== null && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">
            🎉 စကားလုံးပေါင်း {successCount} လုံးကို အောင်မြင်စွာ Bulk Upload ပြုလုပ်ပြီးပါပြီ!
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
            <span>Excel / Google Sheets Column Format (တိုင် အစီအစဉ်)</span>
          </div>

          <button
            type="button"
            onClick={() => parseInput(sampleTemplate)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Load Sample Template
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Column 8 ခု အစီအစဉ်အတိုင်း Excel တွင် ရိုက်ကူးပြီး Copy ကူးထည့်ပါ-</p>
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
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Paste Excel Rows / CSV Text here (ကော်ပီကူးထားသည်များကို ဤနေရာတွင် Paste လုပ်ပါ):
          </label>
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => parseInput(e.target.value)}
            placeholder="Excel သို့မဟုတ် Google Sheets မှ Cells များကို Select လုပ်ပြီး Copy ကူး၍ Paste ချလိုက်ပါ..."
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
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {validCount} ready to import
              </span>
              {invalidCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                  {invalidCount} invalid
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  disabled={importing || validCount === 0}
                  onClick={() => handleBulkUpload('approved')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50">
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Direct Publish All ({validCount}) to Mobile</span>
                </button>
              )}

              <button
                type="button"
                disabled={importing || validCount === 0}
                onClick={() => handleBulkUpload('pending_review')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50">
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>Submit All ({validCount}) for Review</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/70 text-slate-600 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Spoken</th>
                  <th className="py-2.5 px-3 text-blue-700">Academic (Written)</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Myanmar Meaning</th>
                  <th className="py-2.5 px-3">Korean Example</th>
                  <th className="py-2.5 px-3">Myanmar Translation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {parsedRows.map((row, i) => (
                  <tr key={i} className={row.valid ? 'hover:bg-slate-50' : 'bg-red-50/40 text-red-900'}>
                    <td className="py-2 px-3">
                      {row.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] text-red-600 font-semibold">{row.error}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-400 line-through">{row.spoken}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{row.written}</td>
                    <td className="py-2 px-3 text-slate-600">{row.category}</td>
                    <td className="py-2 px-3 font-medium">{row.myanmarMeaning}</td>
                    <td className="py-2 px-3 max-w-xs truncate">{row.exampleKorean || '—'}</td>
                    <td className="py-2 px-3 max-w-xs truncate text-slate-500">{row.exampleMyanmar || '—'}</td>
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
