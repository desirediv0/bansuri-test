"use client";
import { useParams, useRouter } from "next/navigation";
import { batchesData, BatchData } from "../BatchCards";
import { ArrowLeft, Calendar, Music } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// BatchDetailSkeleton component
const BatchDetailSkeleton = () => (
    <div className="animate-pulse">
        <div className="bg-gradient-to-b from-gray-900 to-gray-100 h-48"></div>
        <div className="max-w-7xl mx-auto px-4 py-12 -mt-24">
            <div className="h-8 bg-gray-200 w-24 mb-8 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                    <div className="h-96 bg-gray-200 rounded-xl mb-6"></div>
                    <div className="h-8 bg-gray-200 w-3/4 mb-4 rounded"></div>
                    <div className="h-6 bg-gray-200 w-1/2 mb-6 rounded"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
                <div>
                    <div className="h-10 bg-gray-200 w-3/4 mb-6 rounded"></div>
                    <div className="space-y-4 mb-8">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-full w-full mb-4"></div>
                </div>
            </div>
        </div>
    </div>
);

export default function BatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [batch, setBatch] = useState<BatchData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            const foundBatch = batchesData.find(b => b.slug === params.slug);
            setBatch(foundBatch || null);
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [params.slug]);

    if (loading) {
        return <BatchDetailSkeleton />;
    }

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-3xl font-bold mb-4">Batch Not Found</h1>
                <p className="mb-8">The batch you're looking for doesn't exist.</p>
                <button
                    onClick={() => router.push('/offline-batches')}
                    className="flex items-center gap-2 bg-[#ba1c33] text-white px-6 py-3 rounded-full hover:bg-[#8a1526] transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Batches
                </button>
            </div>
        );
    }

    const openWhatsapp = () => {
        const text = encodeURIComponent(
            `Hi, I'm interested in the ${batch.title} (${batch.type}) batch. Could you please provide me with more information?`
        );
        window.open(`https://wa.me/919971145671?text=${text}`, '_blank');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
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
        <div className="min-h-screen bg-white">
            {/* Dark gradient header */}
            <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-white h-64 w-full"></div>

            <motion.div
                className="max-w-7xl mx-auto px-4 -mt-48 relative z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-20">
                    <div>
                        <motion.div
                            className="relative h-96 rounded-xl overflow-hidden mb-6 shadow-lg"
                            variants={itemVariants}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Image
                                src={batch.image}
                                alt={batch.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <motion.span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {batch.type} CLASS
                                </motion.span>
                                <motion.span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${levelColor}`}
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {batch.level} LEVEL
                                </motion.span>
                            </div>
                        </motion.div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <motion.h1
                                className="text-3xl font-bold text-gray-900 mb-2"
                                variants={itemVariants}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                {batch.title}
                            </motion.h1>

                            <motion.div
                                className="flex items-center gap-2 text-gray-600 mb-6"
                                variants={itemVariants}
                            >
                                <Music size={18} />
                                <span>{batch.fluteType}</span>
                            </motion.div>

                            <motion.div
                                className="prose max-w-none"
                                variants={itemVariants}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <p>{batch.description || "Join our structured flute learning program designed to progress your skills systematically."}</p>

                                <h3 className="text-xl font-semibold mt-6 mb-3 text-[#ba1c33]">What You'll Learn:</h3>
                                <ul className="space-y-2 list-none pl-0">
                                    <motion.li
                                        className="flex items-start gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <span className="inline-block w-2 h-2 bg-[#ba1c33] rounded-full mt-2"></span>
                                        <span>Proper flute holding and breathing techniques</span>
                                    </motion.li>
                                    <motion.li
                                        className="flex items-start gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 }}
                                    >
                                        <span className="inline-block w-2 h-2 bg-[#ba1c33] rounded-full mt-2"></span>
                                        <span>Note production and basic scales</span>
                                    </motion.li>
                                    <motion.li
                                        className="flex items-start gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 }}
                                    >
                                        <span className="inline-block w-2 h-2 bg-[#ba1c33] rounded-full mt-2"></span>
                                        <span>Popular compositions suitable for your level</span>
                                    </motion.li>
                                    <motion.li
                                        className="flex items-start gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.9 }}
                                    >
                                        <span className="inline-block w-2 h-2 bg-[#ba1c33] rounded-full mt-2"></span>
                                        <span>Improvisation basics and rhythmic patterns</span>
                                    </motion.li>
                                </ul>
                            </motion.div>
                        </div>
                    </div>

                    <div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <motion.h2
                                className="text-2xl font-bold text-[#ba1c33] mb-6"
                                variants={itemVariants}
                            >
                                Batch Details
                            </motion.h2>

                            <motion.div
                                className="space-y-4 mb-8"
                                variants={itemVariants}
                            >
                                {batch.batches.map((batchItem, index) => (
                                    <motion.div
                                        key={batchItem.number}
                                        className="bg-white p-5 rounded-lg shadow-sm border border-gray-100"
                                        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                                        transition={{ duration: 0.2 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: { delay: 0.3 + (index * 0.1) }
                                        }}
                                    >
                                        <h3 className="font-medium text-gray-900 border-l-4 border-[#ba1c33] pl-3">Batch {batchItem.number}</h3>
                                        <div className="mt-3 space-y-2">
                                            {batchItem.times.map((time, idx) => (
                                                <div key={idx} className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded">
                                                    <Calendar size={16} className="mt-1 shrink-0 text-[#ba1c33]" />
                                                    <div>
                                                        <span className="font-medium">{time.day}:</span> {time.time}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div
                                className="space-y-4"
                                variants={itemVariants}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <motion.button
                                    onClick={openWhatsapp}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="lucide lucide-message-circle"
                                    >
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                    Contact via WhatsApp
                                </motion.button>



                                <motion.div
                                    className="bg-[#fff9e6] p-5 rounded-lg border border-[#ffe58f] mt-6"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                >
                                    <h3 className="font-semibold text-[#d48806] mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                        Important Instructions:
                                    </h3>
                                    <ul className="text-sm text-[#d48806] space-y-2">
                                        <li className="flex items-start">
                                            <span className="inline-block w-1.5 h-1.5 bg-[#d48806] rounded-full mt-2 mr-2"></span>
                                            Keep your Video's ON during the class.
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-1.5 h-1.5 bg-[#d48806] rounded-full mt-2 mr-2"></span>
                                            Camera focus should be on Flute with hands position.
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-1.5 h-1.5 bg-[#d48806] rounded-full mt-2 mr-2"></span>
                                            Keep the Original Sound ON in zoom meeting.
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-1.5 h-1.5 bg-[#d48806] rounded-full mt-2 mr-2"></span>
                                            Keep the notebook and pen ready.
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-1.5 h-1.5 bg-[#d48806] rounded-full mt-2 mr-2"></span>
                                            You will get recording of every class which you can access for 1 month.
                                        </li>
                                    </ul>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
