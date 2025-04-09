"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/helper/AuthContext";
import { ShoppingCart, LogIn, Trash, PackageX } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { toast } from "sonner";
import { CartItem } from "@/type";
import { truncateDescription } from "../dashboard/_components/TruncateDescription";
import { formatPrice } from "@/helper/FormatPrice";

const Cart: React.FC<{ headerState: string }> = ({ headerState }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchCartItems();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && isOpen) {
            fetchCartItems();
        }
    }, [isAuthenticated, isOpen]);

    const fetchCartItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/cart`
            );
            if (response.data && response.data.success) {
                setCartItems(
                    Array.isArray(response.data.data) ? response.data.data : []
                );
            }
        } catch (error) {
            setError("Error fetching cart items");
            console.error("Error fetching cart items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (id: string) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cart/${id}`);
            setCartItems(cartItems.filter((item) => item.id !== id));
            toast.success("Item removed from cart");
        } catch (error) {
            setError("Error removing item from cart");
            console.error("Error removing item from cart:", error);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            return total + (item.course.salePrice || item.course.price);
        }, 0);
    };

    const calculateOriginalTotal = () => {
        return cartItems.reduce((total, item) => total + item.course.price, 0);
    };

    const getCourseSlugs = () => {
        return cartItems.map(item => encodeURIComponent(item.course.slug)).join("&course-slug=");
    };

    const hasSalePrice = cartItems.some((item) => item.course.salePrice);

    const getImageUrl = (image: string | null | undefined) => {
        if (!image) return 'https://placehold.co/600x400?text=No+Image';
        if (image.startsWith('http')) return image;
        return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
    };


    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant={headerState === "transparent" ? "ghost" : "secondary"}
                    size="sm"
                    className={`relative ${headerState === "transparent"
                        ? "text-white hover:text-red-500"
                        : "text-black hover:text-red-500"
                        }`}
                >
                    <div className="relative">
                        <ShoppingCart className="h-6 w-6" />
                        {isAuthenticated && cartItems.length > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"
                            >
                                {cartItems.length}
                            </motion.div>
                        )}
                    </div>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md bg-gray-50 p-0 border-l border-gray-200 flex flex-col"
            >
                <SheetHeader className="p-6 bg-white shadow-sm">
                    <SheetTitle className="text-2xl font-bold text-gray-900">
                        Shopping Cart
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-140px)]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isLoading ? (
                            [...Array(2)].map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="w-full h-32 bg-gray-100 rounded-lg"
                                />
                            ))
                        ) : error ? (
                            <div className="text-center p-6 bg-red-50 rounded-lg">
                                <p className="text-red-600">{error}</p>
                            </div>
                        ) : !isAuthenticated ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center h-full space-y-4 p-6"
                            >
                                <ShoppingCart className="h-16 w-16 text-gray-400" />
                                <p className="text-gray-600 text-center">
                                    Please log in to view your cart
                                </p>
                                <Link href="/auth">
                                    <Button
                                        size="lg"
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                    >
                                        <LogIn className="h-5 w-5 mr-2" />
                                        Login
                                    </Button>
                                </Link>
                            </motion.div>
                        ) : cartItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center h-full space-y-4 p-6"
                            >
                                <PackageX className="h-16 w-16 text-gray-400" />
                                <p className="text-gray-600 text-lg font-medium">
                                    Your cart is empty
                                </p>
                                <Link href="/courses">
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                    >
                                        Browse Courses
                                    </Button>
                                </Link>
                            </motion.div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                    >
                                        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                                            <CardContent className="p-4">
                                                <div className="flex gap-4">
                                                    <div className="relative w-[80px] h-[80px] flex-shrink-0">
                                                        <Image
                                                            src={getImageUrl(item.course.thumbnail)}
                                                            alt={item.course.title}
                                                            fill
                                                            className="rounded-lg object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 mb-1">
                                                            {item.course.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                            {truncateDescription(item.course.description)}
                                                        </p>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-lg font-bold text-red-600">
                                                                    {formatPrice(item.course.price)}
                                                                </span>
                                                                {item.course.salePrice !== undefined && item.course.salePrice > 0 && (
                                                                    <span className="text-sm text-gray-500 line-through">
                                                                        {formatPrice(item.course.price)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {isAuthenticated && cartItems.length > 0 && (
                        <div className="sticky bottom-0 p-5 bg-white border-t border-gray-200 mt-auto">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-900 font-medium">Total</span>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-red-600">
                                        {formatPrice(calculateTotal())}
                                    </span>
                                    {hasSalePrice && (
                                        <span className="block text-sm text-gray-500 line-through">
                                            {formatPrice(calculateOriginalTotal())}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Link href={`/buy?course-slug=${getCourseSlugs()}`}>
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-medium rounded-lg"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Checkout
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default Cart;
