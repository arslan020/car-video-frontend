const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="bg-white rounded-xl p-6 shadow-soft animate-fadeIn">
                        <div className="skeleton h-6 w-3/4 mb-4"></div>
                        <div className="skeleton h-4 w-full mb-2"></div>
                        <div className="skeleton h-4 w-5/6 mb-4"></div>
                        <div className="flex gap-2">
                            <div className="skeleton h-8 w-20"></div>
                            <div className="skeleton h-8 w-20"></div>
                        </div>
                    </div>
                );

            case 'video':
                return (
                    <div className="bg-white rounded-xl overflow-hidden shadow-soft animate-fadeIn">
                        <div className="skeleton h-48 w-full"></div>
                        <div className="p-4">
                            <div className="skeleton h-5 w-3/4 mb-3"></div>
                            <div className="skeleton h-4 w-1/2"></div>
                        </div>
                    </div>
                );

            case 'table-row':
                return (
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 animate-fadeIn">
                        <div className="col-span-6 flex items-center gap-3">
                            <div className="skeleton h-20 w-32 rounded"></div>
                            <div className="flex-1">
                                <div className="skeleton h-4 w-3/4 mb-2"></div>
                                <div className="skeleton h-3 w-1/2"></div>
                            </div>
                        </div>
                        <div className="col-span-3 flex items-center justify-center">
                            <div className="skeleton h-4 w-24"></div>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                            <div className="skeleton h-4 w-8"></div>
                        </div>
                        <div className="col-span-2 flex items-center justify-center gap-2">
                            <div className="skeleton h-8 w-16 rounded"></div>
                            <div className="skeleton h-8 w-16 rounded"></div>
                        </div>
                    </div>
                );

            case 'stat':
                return (
                    <div className="bg-white rounded-xl p-6 shadow-soft animate-fadeIn">
                        <div className="flex items-center justify-between mb-4">
                            <div className="skeleton h-12 w-12 rounded-full"></div>
                            <div className="skeleton h-6 w-16 rounded-full"></div>
                        </div>
                        <div className="skeleton h-8 w-20 mb-2"></div>
                        <div className="skeleton h-4 w-32"></div>
                    </div>
                );

            case 'text':
                return (
                    <div className="space-y-2 animate-fadeIn">
                        <div className="skeleton h-4 w-full"></div>
                        <div className="skeleton h-4 w-5/6"></div>
                        <div className="skeleton h-4 w-4/6"></div>
                    </div>
                );

            default:
                return <div className="skeleton h-20 w-full"></div>;
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="mb-4">
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

export default SkeletonLoader;
