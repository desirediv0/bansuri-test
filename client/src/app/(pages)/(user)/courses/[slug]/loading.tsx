export default function CourseLoading() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            <div className="bg-gradient-to-t from-red-500 to-black h-[400px]" />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-lg p-6 space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-3/4" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full" />
                                <div className="h-4 bg-gray-200 rounded w-5/6" />
                                <div className="h-4 bg-gray-200 rounded w-4/6" />
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg p-6 space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/2" />
                            <div className="h-12 bg-gray-200 rounded" />
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full" />
                                <div className="h-4 bg-gray-200 rounded w-5/6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}