import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import AuthContext from '../context/AuthContext';
import { FaEye, FaUser, FaCar, FaCalendar, FaPhone, FaEnvelope, FaSearch, FaChevronDown, FaChevronUp, FaBan, FaCheckCircle, FaPaperPlane, FaClock } from 'react-icons/fa';
import API_URL from '../config';

const DATE_FILTERS = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
];

const CustomerViews = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    // Track suspended state per shareId: { [shareId]: true/false }
    const [suspendedMap, setSuspendedMap] = useState({});
    const [suspendLoading, setSuspendLoading] = useState({});
    const [stockRegs, setStockRegs] = useState(new Set());
    const { user } = useContext(AuthContext);

    const fetchVideos = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const url = user.role === 'admin'
                ? `${API_URL}/api/videos?all=true`
                : `${API_URL}/api/videos`;
            const { data } = await axios.get(url, config);
            setVideos(data);

            // Initialize suspendedMap from populated shareId data
            const initialSuspendedMap = {};
            data.forEach(video => {
                (video.views || []).forEach(v => {
                    const sId = v.shareId?._id || v.shareId;
                    if (sId) {
                        initialSuspendedMap[sId] = v.shareId?.suspended ?? false;
                    }
                });
            });
            setSuspendedMap(initialSuspendedMap);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchVideos();
        const fetchStock = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${API_URL}/api/autotrader/stock`, config);
                const regs = new Set(
                    (data.results || []).map(item =>
                        (item.vehicle?.registration || '').replace(/\s/g, '').toUpperCase()
                    ).filter(Boolean)
                );
                setStockRegs(regs);
            } catch (error) {
                console.error('Failed to fetch stock', error);
            }
        };
        fetchStock();
    }, [fetchVideos, user.token]);

    const handleToggleSuspend = async (shareIdObj, e) => {
        e.stopPropagation(); // prevent row expand/collapse
        const sId = shareIdObj?._id || shareIdObj;
        if (!sId) return;

        setSuspendLoading(prev => ({ ...prev, [sId]: true }));
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.patch(`${API_URL}/api/audit-logs/${sId}/suspend`, {}, config);
            setSuspendedMap(prev => ({ ...prev, [sId]: data.suspended }));
        } catch (err) {
            console.error('Failed to toggle suspension:', err);
            alert('Failed to change link status. Please try again.');
        } finally {
            setSuspendLoading(prev => ({ ...prev, [sId]: false }));
        }
    };

    // Flatten all views, newest first
    const allViews = videos
        .flatMap(video =>
            (video.views || []).map(view => ({
                ...view,
                videoTitle: video.title || video.originalName || 'Untitled Video',
                registration: video.registration || null,
                make: video.make || null,
                model: video.model || null,
                uploadedBy: video.uploadedBy,
            }))
        )
        .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

    // ── Date filter ──────────────────────────────────────────────────────────
    const applyDateFilter = (views) => {
        if (dateFilter === 'all') return views;
        const now = new Date();
        return views.filter(v => {
            const d = new Date(v.viewedAt);
            if (dateFilter === 'today') return d.toDateString() === now.toDateString();
            if (dateFilter === 'week') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return d >= startOfWeek;
            }
            if (dateFilter === 'month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }
            return true;
        });
    };

    // ── Search filter ────────────────────────────────────────────────────────
    const applySearch = (views) => {
        if (!searchQuery.trim()) return views;
        const q = searchQuery.toLowerCase().trim();
        return views.filter(v =>
            (v.viewerName || '').toLowerCase().includes(q) ||
            (v.viewerEmail || '').toLowerCase().includes(q) ||
            (v.viewerMobile || '').includes(q) ||
            (v.make || '').toLowerCase().includes(q) ||
            (v.model || '').toLowerCase().includes(q) ||
            (v.registration || '').toLowerCase().includes(q)
        );
    };

    const filteredViews = applySearch(applyDateFilter(allViews));

    // ── Group duplicate views (same customer + same vehicle) ─────────────────
    const groupedViews = filteredViews.reduce((acc, view) => {
        const key = `${view.viewerEmail || ''}-${view.viewerMobile || ''}-${view.viewerName || ''}-${view.registration || view.videoTitle}`;
        if (!acc[key]) {
            acc[key] = { ...view, count: 1, allTimes: [view.viewedAt] };
        } else {
            acc[key].count += 1;
            acc[key].allTimes.push(view.viewedAt);
            // Keep the most recent viewedAt as the primary
            if (new Date(view.viewedAt) > new Date(acc[key].viewedAt)) {
                acc[key].viewedAt = view.viewedAt;
            }
        }
        return acc;
    }, {});

    const groupedRows = Object.entries(groupedViews).sort(
        ([, a], [, b]) => new Date(b.viewedAt) - new Date(a.viewedAt)
    );

    const totalPages = Math.ceil(groupedRows.length / ITEMS_PER_PAGE);
    const paginatedRows = groupedRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ── Stats (based on ALL views, not filtered) ─────────────────────────────
    const totalViews = allViews.length;
    const uniqueCustomers = new Set(allViews.map(v => v.viewerEmail || v.viewerMobile || v.viewerName)).size;
    const todayViews = allViews.filter(v => {
        const d = new Date(v.viewedAt);
        return d.toDateString() === new Date().toDateString();
    }).length;

    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <DashboardLayout>
            <div className="w-full px-6">
                {/* Header */}
                <header className="mb-6 md:mb-8 border-b pb-4 border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Customer Views</h1>
                            <p className="text-sm md:text-base text-gray-500 mt-1">
                                Track who opened your shared video links and when.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Total Views</p>
                        <p className="text-3xl font-bold text-blue-600">{totalViews}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Unique Customers</p>
                        <p className="text-3xl font-bold text-indigo-600">{uniqueCustomers}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Viewed Today</p>
                        <p className="text-3xl font-bold text-emerald-600">{todayViews}</p>
                    </div>
                </div>

                {/* Search & Date Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    {/* Search input */}
                    <div className="relative flex-1">
                        <FaSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone or vehicle…"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Date filter buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                        {DATE_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => { setDateFilter(f.value); setCurrentPage(1); }}
                                className={`px-4 py-2.5 text-sm rounded-xl border font-medium transition
                                    ${dateFilter === f.value
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Result count */}
                {(searchQuery || dateFilter !== 'all') && (
                    <p className="text-xs text-gray-400 mb-3">
                        Showing <span className="font-semibold text-gray-600">{groupedRows.length}</span> result{groupedRows.length !== 1 ? 's' : ''}
                        {searchQuery && <> for <span className="font-semibold text-gray-600">"{searchQuery}"</span></>}
                    </p>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="spinner"></div>
                    </div>
                ) : groupedRows.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-5">
                            <FaEye className="text-gray-300" size={36} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {searchQuery || dateFilter !== 'all' ? 'No results found' : 'No views recorded yet'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {searchQuery || dateFilter !== 'all'
                                ? 'Try adjusting your search or date filter.'
                                : "When a customer opens a link you've sent via email or SMS, their details will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle</th>
                                        {user?.role === 'admin' && (
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent By</th>
                                        )}
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Viewed</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Expires</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Views</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Link</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.map(([key, view], rowIndex) => {
                                        const globalRowIndex = (currentPage - 1) * ITEMS_PER_PAGE + rowIndex + 1;
                                        const isExpanded = expandedGroups[key];
                                        const hasMultiple = view.count > 1;
                                        const shareId = view.shareId?._id || view.shareId;
                                        const isSuspended = shareId ? (suspendedMap[shareId] ?? (view.shareId?.suspended || false)) : false;
                                        const isTogglingThis = shareId ? (suspendLoading[shareId] ?? false) : false;
                                        const normViewReg = (view.registration || '').replace(/\s/g, '').toUpperCase();
                                        const isSold = normViewReg && stockRegs.size > 0 && !stockRegs.has(normViewReg);

                                        return [
                                            <tr key={key}
                                                className={`group border-b border-gray-100 transition-colors ${hasMultiple ? 'cursor-pointer' : ''} ${isSuspended ? 'bg-red-50/30' : 'bg-white hover:bg-gray-50/80'}`}
                                                onClick={() => hasMultiple && toggleGroup(key)}>

                                                {/* Row number */}
                                                <td className="px-5 py-3.5 text-xs text-gray-300 font-medium">{globalRowIndex}</td>

                                                {/* Customer + Contact folded */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isSuspended ? 'bg-red-100' : 'bg-gradient-to-br from-blue-100 to-indigo-200'}`}>
                                                            <FaUser size={13} className={isSuspended ? 'text-red-500' : 'text-blue-600'} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-gray-900 text-sm leading-tight">
                                                                    {view.viewerName || 'Unknown'}
                                                                </span>
                                                                {isSuspended && (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full border border-red-200">
                                                                        <FaBan size={8} /> Suspended
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                {view.viewerEmail && (
                                                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                        <FaEnvelope size={9} /> {view.viewerEmail}
                                                                    </span>
                                                                )}
                                                                {view.viewerMobile && (
                                                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                        <FaPhone size={9} /> {view.viewerMobile}
                                                                    </span>
                                                                )}
                                                                {!view.viewerEmail && !view.viewerMobile && (
                                                                    <span className="text-xs text-gray-300 italic">No contact</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Vehicle */}
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm font-medium text-gray-800 leading-tight">
                                                        {view.make && view.model ? `${view.make} ${view.model}` : view.videoTitle}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                        {view.registration && (
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 font-mono text-xs rounded-md border border-blue-100">
                                                                {view.registration}
                                                            </span>
                                                        )}
                                                        {isSold && (
                                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-md border border-red-200">
                                                                Sold
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Sent By (Admin only) */}
                                                {user?.role === 'admin' && (
                                                    <td className="px-5 py-3.5 text-xs text-gray-500">
                                                        {view.shareId?.user?.name || view.shareId?.user?.username || view.uploadedBy?.name || view.uploadedBy?.username || '—'}
                                                    </td>
                                                )}

                                                {/* Last Viewed */}
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {new Date(view.viewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                        <FaClock size={9} />
                                                        {new Date(view.viewedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>

                                                {/* Sent / Expires — compact */}
                                                <td className="px-5 py-3.5">
                                                    {view.shareId?.createdAt ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                                <FaPaperPlane size={9} />
                                                                {new Date(view.shareId.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </div>
                                                            {view.shareId?.metadata?.expiresAt ? (
                                                                (() => {
                                                                    const isExpired = new Date() > new Date(view.shareId.metadata.expiresAt);
                                                                    return (
                                                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                                                            {isExpired ? 'Expired' : 'Expires'} {new Date(view.shareId.metadata.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                                        </span>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span className="text-xs text-gray-300 italic">No expiry</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-300 italic">—</span>
                                                    )}
                                                </td>

                                                {/* View count badge */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${hasMultiple ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                            <FaEye size={9} /> {view.count}x
                                                        </span>
                                                        {hasMultiple && (isExpanded
                                                            ? <FaChevronUp size={10} className="text-gray-400" />
                                                            : <FaChevronDown size={10} className="text-gray-400" />)}
                                                    </div>
                                                </td>

                                                {/* Suspend / Enable Button */}
                                                <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                                                    {shareId ? (
                                                        <button
                                                            onClick={(e) => handleToggleSuspend(shareId, e)}
                                                            disabled={isTogglingThis}
                                                            title={isSuspended ? 'Enable this link' : 'Suspend this link'}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                                                ${isSuspended
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                                }
                                                                ${isTogglingThis ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                            `}
                                                        >
                                                            {isTogglingThis ? (
                                                                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                            ) : isSuspended ? (
                                                                <><FaCheckCircle size={10} /> Enable</>
                                                            ) : (
                                                                <><FaBan size={10} /> Suspend</>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-300 italic">No token</span>
                                                    )}
                                                </td>
                                            </tr>,

                                            // Expanded rows — show all individual view times
                                            hasMultiple && isExpanded && view.allTimes.map((time, i) => (
                                                <tr key={`${key}-expanded-${i}`} className="bg-blue-50/30 border-b border-blue-100/60">
                                                    <td className="px-5 py-2 pl-14" colSpan={user?.role === 'admin' ? 3 : 2}>
                                                        <span className="text-xs text-gray-400 italic">View #{view.count - i}</span>
                                                    </td>
                                                    {user?.role === 'admin' && <td />}
                                                    <td className="px-5 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendar size={10} className="text-blue-400" />
                                                            <span className="text-xs text-gray-600">
                                                                {new Date(time).toLocaleDateString('en-GB', {
                                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                                })}{' '}
                                                                <span className="text-gray-400">
                                                                    {new Date(time).toLocaleTimeString('en-GB', {
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td />
                                                    <td />
                                                </tr>
                                            ))
                                        ];
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
                                <p className="text-sm text-gray-500">
                                    Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, groupedRows.length)}</span> of <span className="font-semibold text-gray-700">{groupedRows.length}</span> results
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 text-sm rounded-lg border transition font-medium ${
                                                page === currentPage
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'border-gray-200 text-gray-600 hover:bg-white'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CustomerViews;
