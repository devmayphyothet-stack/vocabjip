import React from 'react';
import { Bookmark, Volume2, Sparkles, Smartphone } from 'lucide-react';

interface MobileCardPreviewProps {
  type: 'vocab' | 'pattern';
  data: {
    spoken?: string;
    written?: string;
    pronunciation?: string;
    category?: string;
    myanmarMeaning?: string;
    englishMeaning?: string;
    usageTip?: string;
    exampleKorean?: string;
    exampleMyanmar?: string;
    // For pattern
    questionNumber?: string;
    title?: string;
    myanmarTitle?: string;
    patternFormula?: string;
    keyPhrases?: string[];
  };
}

export function MobileCardPreview({ type, data }: MobileCardPreviewProps) {
  return (
    <div className="w-80 shrink-0">
      <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          Live Mobile App Preview
        </span>
        <span className="text-[10px] text-slate-400 font-mono">iPhone 17 View</span>
      </div>

      {/* iPhone frame container */}
      <div className="bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800">
        {/* Dynamic Island / speaker */}
        <div className="w-24 h-4 bg-black rounded-full mx-auto mb-3"></div>

        {/* Screen Content */}
        <div className="bg-[#FAF9F5] rounded-[28px] p-4 min-h-[460px] flex flex-col justify-between text-slate-900 select-none">
          {type === 'vocab' ? (
            /* Vocabulary Card */
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                {/* Header Tag & Bookmark */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {data.category || 'Category'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    <Bookmark className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Spoken -> Academic Words */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">SPOKEN</div>
                    <div className="text-sm font-semibold text-slate-400 line-through">
                      {data.spoken || '그래서'}
                    </div>
                  </div>

                  <div className="text-slate-300 font-bold">→</div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">ACADEMIC</div>
                    <div className="text-base font-extrabold text-slate-900">
                      {data.written || '따라서'}
                    </div>
                  </div>
                </div>

                {/* Pronunciation */}
                {data.pronunciation && (
                  <p className="text-[11px] text-slate-400 italic font-mono text-center">
                    [{data.pronunciation}]
                  </p>
                )}

                {/* Myanmar Meaning */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {data.myanmarMeaning || 'မြန်မာဘာသာပြန် အဓိပ္ပာယ်'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {data.englishMeaning || 'English translation'}
                  </p>
                </div>

                {/* Tip box */}
                {data.usageTip && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                    <span className="font-bold text-amber-800">💡 TOPIK Tip: </span>
                    {data.usageTip}
                  </div>
                )}

                {/* Example sentence */}
                {data.exampleKorean && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                    <p className="font-medium text-slate-900 font-sans">{data.exampleKorean}</p>
                    <p className="text-[11px] text-slate-500">{data.exampleMyanmar}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Pattern Card */
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    {data.questionNumber || 'Q53'}
                  </span>
                  <Bookmark className="w-4 h-4 text-slate-400" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{data.title || 'Describe a Trend'}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{data.myanmarTitle || 'မြန်မာဘာသာ ခေါင်းစဉ်'}</p>
                </div>

                {/* Formula box */}
                <div className="p-2.5 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800 leading-relaxed border border-slate-200/70">
                  {data.patternFormula || '[조사 대상]에 대해 조사한 결과...'}
                </div>

                {/* Korean Example */}
                {data.exampleKorean && (
                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-200/50 text-xs space-y-1">
                    <p className="font-medium text-slate-900">{data.exampleKorean}</p>
                    <p className="text-[11px] text-slate-500">{data.exampleMyanmar}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom home indicator */}
          <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto mt-4"></div>
        </div>
      </div>
    </div>
  );
}
