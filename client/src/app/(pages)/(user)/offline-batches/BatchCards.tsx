"use client";
import { Calendar, Music } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type BatchType = "LIVE" | "OFFLINE";
export type BatchLevel = "BEGINNERS" | "INTERMEDIATE" | "EXPERT" | "ADVANCE";
export type BatchTime = {
    day: string;
    time: string;
};

export interface BatchData {
    id: string;
    title: string;
    type: BatchType;
    fluteType: string;
    level: BatchLevel;
    batches: {
        number: number;
        times: BatchTime[];
    }[];
    image: string;
    slug: string;
    description?: string;
}

export const batchesData: BatchData[] = [
    {
        id: "1",
        title: "C Natural Flute - Beginners",
        type: "LIVE",
        fluteType: "C Natural Flute",
        level: "BEGINNERS",
        batches: [
            {
                number: 1,
                times: [{ day: "Saturday", time: "5-6pm" }]
            },
            {
                number: 2,
                times: [{ day: "Wednesday", time: "7-8pm" }]
            }
        ],
        image: "/c1.jpg",
        slug: "c-natural-beginners-live",
        description: "Start your flute journey with our beginner-friendly C Natural Flute class. Perfect for those with no prior experience."
    },
    {
        id: "2",
        title: "G Natural Base Flute - Intermediate",
        type: "LIVE",
        fluteType: "G Natural Base Flute",
        level: "INTERMEDIATE",
        batches: [
            {
                number: 1,
                times: [{ day: "Sunday", time: "12:30pm" }]
            }
        ],
        image: "/c1.jpg",
        slug: "g-natural-intermediate-live",
        description: "Take your flute skills to the next level with our intermediate G Natural Base Flute classes."
    },
    {
        id: "3",
        title: "E Base Flute - Expert",
        type: "LIVE",
        fluteType: "E Base Flute",
        level: "EXPERT",
        batches: [
            {
                number: 2,
                times: [{ day: "Saturday", time: "6pm" }]
            }
        ],
        image: "/c1.jpg",
        slug: "e-base-expert-live",
        description: "Advance your flute mastery with our expert-level E Base Flute class. For experienced players only."
    },
    {
        id: "4",
        title: "C Natural Flute - Beginners",
        type: "OFFLINE",
        fluteType: "C Natural Flute",
        level: "BEGINNERS",
        batches: [
            {
                number: 1,
                times: [{ day: "Sunday", time: "4 to 5:30pm" }]
            },
            {
                number: 2,
                times: [{ day: "Saturday", time: "9:30 to 11am" }]
            }
        ],
        image: "/c1.jpg",
        slug: "c-natural-beginners-offline",
        description: "Learn the basics of flute playing in-person with our beginner-friendly C Natural Flute offline class."
    },
    {
        id: "5",
        title: "G Base Flute - Intermediate",
        type: "OFFLINE",
        fluteType: "G Base Flute",
        level: "INTERMEDIATE",
        batches: [
            {
                number: 1,
                times: [{ day: "Sunday", time: "9:30am to 11am" }]
            },
            {
                number: 2,
                times: [{ day: "Sunday", time: "12:30 to 2pm" }]
            }
        ],
        image: "/c1.jpg",
        slug: "g-base-intermediate-offline",
        description: "Enhance your skills with our intermediate G Base Flute offline classes in a supportive environment."
    },
    {
        id: "6",
        title: "E Base Flute - Advanced",
        type: "OFFLINE",
        fluteType: "E Base Flute",
        level: "ADVANCE",
        batches: [
            {
                number: 1,
                times: [{ day: "Sunday", time: "11-12:30pm" }]
            },
            {
                number: 2,
                times: [{ day: "Saturday", time: "12:30 to 2pm" }]
            }
        ],
        image: "/c1.jpg",
        slug: "e-base-advanced-offline",
        description: "Master advanced techniques with our E Base Flute offline classes designed for serious flute players."
    }
];

const primaryColor = "#ba1c33";
const primaryLight = "#f9e6e8";
const primaryDark = "#8a1526";

const BatchCardSkeleton = () => {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300" />
            <div className="p-5">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />
                <div className="flex gap-2 mb-4">
                    <div className="h-8 bg-gray-300 rounded w-1/3" />
                    <div className="h-8 bg-gray-300 rounded w-1/3" />
                </div>
                <div className="h-10 bg-gray-300 rounded-full w-full" />
            </div>
        </div>
    );
};

const BatchCard = ({ batch }: { batch: BatchData }) => {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/offline-batches/${batch.slug}`);
    };

    const badgeColor = batch.type === 'LIVE'
        ? 'bg-[#f9e6e8] text-[#ba1c33]'
        : 'bg-[#e6f0f9] text-[#2563eb]';

    const levelColor = {
        'BEGINNERS': 'bg-green-100 text-green-800',
        'INTERMEDIATE': 'bg-yellow-100 text-yellow-800',
        'EXPERT': 'bg-purple-100 text-purple-800',
        'ADVANCE': 'bg-purple-100 text-purple-800'
    }[batch.level];

    return (
        <motion.div
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                type: "spring",
                stiffness: 100
            }}
            className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all"
            onClick={handleClick}
        >
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={batch.image}
                    alt={batch.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                        {batch.type} CLASS
                    </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-lg font-bold text-white">{batch.title}</h3>
                </div>
            </div>
            <div className="p-5">
                <div className="flex items-center gap-1 mt-1 text-gray-600">
                    <Music size={16} />
                    <span className="text-sm">{batch.fluteType}</span>
                </div>
                <div className="flex flex-wrap gap-2 my-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColor}`}>
                        {batch.level} LEVEL
                    </span>
                </div>
                <div className="space-y-2 mb-4">
                    {batch.batches.map((batchItem) => (
                        <div key={batchItem.number} className="flex items-center text-sm text-gray-600">
                            <Calendar size={14} className="mr-1" />
                            <span>Batch {batchItem.number}: </span>
                            <div className="ml-1">
                                {batchItem.times.map((time, i) => (
                                    <div key={i}>
                                        <span className="font-medium">{time.day}</span> {time.time}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full bg-[${primaryColor}] hover:bg-[${primaryDark}] text-white font-medium py-2 px-4 rounded-full transition-colors`}
                    style={{ backgroundColor: primaryColor }}
                >
                    View Details
                </motion.button>
            </div>
        </motion.div>
    );
};

export default function BatchCards() {
    const [activeTab, setActiveTab] = useState<'all' | 'live' | 'offline'>('all');

    const filteredBatches = batchesData.filter(batch => {
        if (activeTab === 'all') return true;
        if (activeTab === 'live') return batch.type === 'LIVE';
        if (activeTab === 'offline') return batch.type === 'OFFLINE';
        return true;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                    <BatchCardSkeleton key={i} />
                ))}
            </div>
        }>
            <div>
                <div className="flex justify-center mb-12">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`px-5 py-3 text-sm font-medium border border-[${primaryColor}] rounded-l-lg focus:z-10 focus:ring-2 focus:ring-[${primaryColor}] transition-all ${activeTab === 'all'
                                ? `bg-[${primaryColor}] text-white`
                                : `text-[${primaryColor}] bg-white hover:bg-[${primaryLight}]`
                                }`}
                            style={{
                                borderColor: primaryColor,
                                backgroundColor: activeTab === 'all' ? primaryColor : 'white',
                                color: activeTab === 'all' ? 'white' : primaryColor
                            }}
                        >
                            All Batches
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('live')}
                            className={`px-5 py-3 text-sm font-medium border-y border-[${primaryColor}] focus:z-10 focus:ring-2 focus:ring-[${primaryColor}] transition-all ${activeTab === 'live'
                                ? `bg-[${primaryColor}] text-white`
                                : `text-[${primaryColor}] bg-white hover:bg-[${primaryLight}]`
                                }`}
                            style={{
                                borderColor: primaryColor,
                                backgroundColor: activeTab === 'live' ? primaryColor : 'white',
                                color: activeTab === 'live' ? 'white' : primaryColor
                            }}
                        >
                            Live Classes
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('offline')}
                            className={`px-5 py-3 text-sm font-medium border border-[${primaryColor}] rounded-r-lg focus:z-10 focus:ring-2 focus:ring-[${primaryColor}] transition-all ${activeTab === 'offline'
                                ? `bg-[${primaryColor}] text-white`
                                : `text-[${primaryColor}] bg-white hover:bg-[${primaryLight}]`
                                }`}
                            style={{
                                borderColor: primaryColor,
                                backgroundColor: activeTab === 'offline' ? primaryColor : 'white',
                                color: activeTab === 'offline' ? 'white' : primaryColor
                            }}
                        >
                            Offline Classes
                        </button>
                    </div>
                </div>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence>
                        {filteredBatches.map((batch) => (
                            <BatchCard key={batch.id} batch={batch} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </Suspense>
    );
}
