/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  RotateCcw, 
  Phone, 
  MessageCircle, 
  Building2, 
  Navigation,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface PollingStation {
  acName: string;
  partName: string;
  ro: string;
  roMobile: string;
  aro1: string;
  aro1Mobile: string;
  aro2: string;
  aro2Mobile: string;
  aro3: string;
  aro3Mobile: string;
  zonalOfficer: string;
  zonalOfficerMobile: string;
  zonalAsst: string;
  zonalAsstMobile: string;
  bloName: string;
  bloMobile: string;
  po: string;
  poMobile: string;
  po1: string;
  po1Mobile: string;
  po2: string;
  po2Mobile: string;
  po3: string;
  po3Mobile: string;
}

// --- Constants ---

const SPREADSHEET_ID = '1fYjuG_PFwR8FRcPsX2rLKRtHymYFbWXZ';
const SHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

// --- Utility Functions ---

const cleanValue = (val: any) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'object' && val.v !== undefined) return String(val.v).trim() || 'NULL';
  return String(val).trim() || 'NULL';
};

// --- Components ---

function OfficerCard({ label, name, phone }: { label: string; name: string; phone: string }) {
  const isNull = name === 'NULL' || !name;
  const isPhoneNull = phone === 'NULL' || !phone;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex items-center justify-between group gap-4">
        <span className={`text-lg font-bold min-w-0 flex-1 truncate ${isNull ? 'text-slate-300' : 'text-slate-900'} transition-colors`} title={name}>
          {name || 'NULL'}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <a 
            href={isPhoneNull ? '#' : `tel:${phone}`}
            onClick={(e) => isPhoneNull && e.preventDefault()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shrink-0 ${
              isPhoneNull 
              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
              : 'bg-pink-50 border-pink-100 text-pink-600 hover:bg-pink-100 hover:border-pink-200 active:scale-95'
            }`}
          >
            <Phone size={14} className="shrink-0" />
            <span className="text-xs font-bold leading-none">{phone || 'NULL'}</span>
          </a>
          <a 
            href={isPhoneNull ? '#' : `https://wa.me/91${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => isPhoneNull && e.preventDefault()}
            className={`w-8 h-8 flex items-center justify-center transition-all rounded-full overflow-hidden shrink-0 ${
              isPhoneNull 
              ? 'opacity-30 grayscale cursor-not-allowed' 
              : 'hover:scale-110 active:scale-95'
            }`}
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
              alt="WhatsApp" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<PollingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [selectedAC, setSelectedAC] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_JSON_URL);
        const text = await response.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
        
        if (!match) throw new Error('Failed to parse sheet data');
        
        const json = JSON.parse(match[1]);
        const rows = json.table.rows;
        const cols = json.table.cols;

        // Map column indices by searching for labels or using defaults
        const findIdx = (keywords: string[], defaultIdx: number) => {
          const idx = cols.findIndex((c: any) => 
            keywords.some(k => c.label?.toLowerCase()?.includes(k.toLowerCase()))
          );
          return idx !== -1 ? idx : defaultIdx;
        };

        const idxMap = {
          ac: findIdx(['ac', 'constituency'], 1),
          part: 2, // User explicitly requested Column C
          ro: findIdx(['ro_name', 'returning officer'], 3),
          roMob: findIdx(['ro_no', 'ro_mobile', 'ro_mob'], 4),
          aro1: findIdx(['aro1_name', 'aro1 officer'], 5),
          aro1Mob: findIdx(['aro1_no', 'aro1_mobile', 'aro1_mob'], 6),
          aro2: findIdx(['aro2_name', 'aro2 officer'], 7),
          aro2Mob: findIdx(['aro2_no', 'aro2_mobile', 'aro2_mob'], 8),
          aro3: findIdx(['aro3_name', 'aro3 officer'], 9),
          aro3Mob: findIdx(['aro3_no', 'aro3_mobile', 'aro3_mob'], 10),
          zOfficer: findIdx(['zonal officer', 'z_off'], 11),
          zOfficerMob: findIdx(['zonal_no', 'zonal_mobile', 'z_mob'], 12),
          zAsst: findIdx(['zonal asst', 'z_asst'], 13),
          zAsstMob: findIdx(['asst_no', 'asst_mobile', 'asst_mob'], 14),
          blo: findIdx(['blo_name', 'blo'], 15),
          bloMob: findIdx(['blo_no', 'blo_mobile', 'blo_mob'], 16),
          po: findIdx(['po_name', 'po'], 17),
          poMob: findIdx(['po_no', 'po_mobile', 'po_mob'], 18),
          po1: findIdx(['po1_name', 'po1'], 19),
          po1Mob: findIdx(['po1_no', 'po1_mobile', 'po1_mob'], 20),
          po2: findIdx(['po2_name', 'po2'], 21),
          po2Mob: findIdx(['po2_no', 'po2_mobile', 'po2_mob'], 22),
          po3: findIdx(['po3_name', 'po3'], 23),
          po3Mob: findIdx(['po3_no', 'po3_mobile', 'po3_mob'], 24),
        };

        const mappedData: PollingStation[] = rows.map((row: any) => {
          const c = row.c;
          return {
            acName: cleanValue(c[idxMap.ac]),
            partName: cleanValue(c[idxMap.part]),
            ro: cleanValue(c[idxMap.ro]),
            roMobile: cleanValue(c[idxMap.roMob]),
            aro1: cleanValue(c[idxMap.aro1]),
            aro1Mobile: cleanValue(c[idxMap.aro1Mob]),
            aro2: cleanValue(c[idxMap.aro2]),
            aro2Mobile: cleanValue(c[idxMap.aro2Mob]),
            aro3: cleanValue(c[idxMap.aro3]),
            aro3Mobile: cleanValue(c[idxMap.aro3Mob]),
            zonalOfficer: cleanValue(c[idxMap.zOfficer]),
            zonalOfficerMobile: cleanValue(c[idxMap.zOfficerMob]),
            zonalAsst: cleanValue(c[idxMap.zAsst]),
            zonalAsstMobile: cleanValue(c[idxMap.zAsstMob]),
            bloName: cleanValue(c[idxMap.blo]),
            bloMobile: cleanValue(c[idxMap.bloMob]),
            po: cleanValue(c[idxMap.po]),
            poMobile: cleanValue(c[idxMap.poMob]),
            po1: cleanValue(c[idxMap.po1]),
            po1Mobile: cleanValue(c[idxMap.po1Mob]),
            po2: cleanValue(c[idxMap.po2]),
            po2Mobile: cleanValue(c[idxMap.po2Mob]),
            po3: cleanValue(c[idxMap.po3]),
            po3Mobile: cleanValue(c[idxMap.po3Mob]),
          };
        }).filter((p: PollingStation) => p.acName !== 'NULL');

        setData(mappedData);
      } catch (err) {
        console.error(err);
        setError('Failed to load constituency data. Please verify the spreadsheet accessibility.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const acNames = useMemo(() => {
    return Array.from(new Set(data.map(item => item.acName))).sort();
  }, [data]);

  const parts = useMemo(() => {
    if (!selectedAC) return [];
    return data
      .filter(item => item.acName === selectedAC)
      .map(item => item.partName)
      .sort();
  }, [data, selectedAC]);

  const filteredParts = useMemo(() => {
    return parts.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [parts, searchQuery]);

  const currentResult = useMemo(() => {
    if (!showResult) return null;
    return data.find(p => p.acName === selectedAC && p.partName === selectedPart);
  }, [data, selectedAC, selectedPart, showResult]);

  const handleReset = () => {
    setSelectedAC('');
    setSelectedPart('');
    setSearchQuery('');
    setShowResult(false);
    setIsDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading Polling Station Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-100">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Official Directory 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#0A1D37] tracking-tight">
            TENKASI DISTRICT
          </h1>
          <h2 className="text-2xl md:text-5xl font-black text-blue-600 tracking-tight">
            POLLING STATION DIRECTORY
          </h2>
          <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full mt-2" />
        </div>

        {/* Search Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-[40px] border border-white shadow-2xl shadow-blue-900/10 p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* AC Select */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4">
                Assembly Constituency
              </label>
              <div className="relative group">
                <select
                  value={selectedAC}
                  onChange={(e) => {
                    setSelectedAC(e.target.value);
                    setSelectedPart('');
                    setSearchQuery('');
                  }}
                  className="w-full h-16 px-6 bg-white border-2 border-slate-100 rounded-2xl text-lg font-bold text-slate-800 appearance-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer group-hover:border-slate-200"
                >
                  <option value="" disabled>Choose Constituency...</option>
                  {acNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            {/* Part Select (Autocomplete Search) */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4">
                Search & Select
              </label>
              <div className="relative">
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={22} />
                  </div>
                  <input
                    type="text"
                    placeholder={selectedAC ? "Search Part Name..." : "Select AC first..."}
                    readOnly={!selectedAC}
                    value={selectedPart || searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedPart('');
                      setIsDropdownOpen(true);
                      setShowResult(false);
                    }}
                    onFocus={() => selectedAC && setIsDropdownOpen(true)}
                    className="w-full h-16 pl-16 pr-6 bg-white border-2 border-slate-100 rounded-2xl text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed group-hover:border-slate-200"
                  />
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && selectedAC && (filteredParts.length > 0 || searchQuery) && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto"
                      >
                        {filteredParts.length > 0 ? (
                          filteredParts.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedPart(p);
                                setSearchQuery(p);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full px-6 py-4 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 border-b border-slate-50 last:border-none transition-colors"
                            >
                              {p}
                            </button>
                          ))
                        ) : (
                          <div className="px-6 py-8 text-center text-slate-400 font-medium">
                            No matching part found
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowResult(true)}
              disabled={!selectedPart}
              className="flex-1 h-16 bg-[#0A1D37] text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-[#152C4D] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-xl shadow-blue-900/10"
            >
              <Search size={24} />
              SEARCH LOCATION
            </button>
            <button
              onClick={handleReset}
              className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-200 active:scale-[0.98] transition-all"
              title="Reset Filters"
            >
              <RotateCcw size={24} />
            </button>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {showResult && currentResult && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="space-y-6"
            >
              {/* Main Detail Card */}
              <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 overflow-hidden border border-white">
                <div className="p-8 md:p-10 space-y-10">
                  {/* Result Header */}
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 shrink-0">
                      <Building2 size={40} />
                    </div>
                    <div className="space-y-3 pt-2 flex-1">
                      <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                          AC: {currentResult.acName}
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <p className="text-lg md:text-xl font-black text-[#0A1D37] leading-tight flex items-center gap-3">
                          <Navigation size={20} className="text-blue-500 shrink-0" />
                          {currentResult.partName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Officers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <OfficerCard label="RO" name={currentResult.ro} phone={currentResult.roMobile} />
                    <OfficerCard label="ARO1" name={currentResult.aro1} phone={currentResult.aro1Mobile} />
                    <OfficerCard label="ARO2" name={currentResult.aro2} phone={currentResult.aro2Mobile} />
                    <OfficerCard label="ARO3" name={currentResult.aro3} phone={currentResult.aro3Mobile} />
                    <OfficerCard label="Zonal Officer" name={currentResult.zonalOfficer} phone={currentResult.zonalOfficerMobile} />
                    <OfficerCard label="Zonal Asst" name={currentResult.zonalAsst} phone={currentResult.zonalAsstMobile} />
                    <OfficerCard label="BLO Name" name={currentResult.bloName} phone={currentResult.bloMobile} />
                  </div>

                  <div className="h-px bg-slate-100 mx-[-2.5rem]" />

                  {/* Secondary Officers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <OfficerCard label="PO" name={currentResult.po} phone={currentResult.poMobile} />
                    <OfficerCard label="PO 1" name={currentResult.po1} phone={currentResult.po1Mobile} />
                    <OfficerCard label="PO 2" name={currentResult.po2} phone={currentResult.po2Mobile} />
                    <OfficerCard label="PO 3" name={currentResult.po3} phone={currentResult.po3Mobile} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-red-50 border border-red-100 p-6 rounded-[32px] text-center">
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}
