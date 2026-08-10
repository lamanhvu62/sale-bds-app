// Hiệu ứng shimmer cho skeleton
const shimmer = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

// Skeleton cho card khách hàng
export function KhachHangSkeleton() {
    return (
        <div className={`bg-white rounded-xl p-4 shadow-sm ${shimmer}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex gap-2 mt-3">
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
                <div className="h-5 w-12 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

// Skeleton cho card dự án
export function DuAnSkeleton() {
    return (
        <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${shimmer}`}>
            <div className="h-40 bg-gray-200"></div>
            <div className="p-4 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="flex gap-2">
                    <div className="h-5 w-16 bg-gray-200 rounded"></div>
                    <div className="h-5 w-12 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}

// Skeleton cho lịch hẹn
export function LichHenSkeleton() {
    return (
        <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 border-gray-200 ${shimmer}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="flex gap-1">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}

// Skeleton cho calendar
export function CalendarSkeleton() {
    return (
        <div className={`bg-gray-50 rounded-xl p-2 ${shimmer}`}>
            <div className="grid grid-cols-7 gap-1 mb-1">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded"></div>
                ))}
            </div>
            {[...Array(5)].map((_, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                    {[...Array(7)].map((_, di) => (
                        <div key={di} className="h-10 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// Skeleton cho stats trong Dashboard
export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className={`bg-white rounded-xl p-4 shadow-sm ${shimmer}`}>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
            ))}
        </div>
    );
}