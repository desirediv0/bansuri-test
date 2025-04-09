"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Book, Calendar, CreditCard } from 'lucide-react';
import MyClasses from './components/MyClasses';
import PurchaseHistory from './components/PurchaseHistory';

export default function ProfilePage() {
    const [user] = useState({
        name: 'Ritesh Sharma',
        email: 'rahul.sharma@example.com',
        joinedDate: 'January 2023'
    });

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                            <CardTitle className="text-center mt-4">{user.name}</CardTitle>
                            <CardDescription className="text-center">{user.email}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground text-center">
                                Member since {user.joinedDate}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="classes">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="classes" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="hidden sm:inline">My Classes</span>
                                <span className="sm:hidden">Classes</span>
                            </TabsTrigger>
                            <TabsTrigger value="courses" className="flex items-center gap-2">
                                <Book className="h-4 w-4" />
                                <span className="hidden sm:inline">My Courses</span>
                                <span className="sm:hidden">Courses</span>
                            </TabsTrigger>
                            <TabsTrigger value="purchases" className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                <span className="hidden sm:inline">Purchase History</span>
                                <span className="sm:hidden">Purchases</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="classes" className="mt-6">
                            <MyClasses />
                        </TabsContent>

                        <TabsContent value="courses" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>My Courses</CardTitle>
                                    <CardDescription>
                                        View all your purchased courses here
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-center py-10 text-muted-foreground">
                                        You haven't purchased any courses yet
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="purchases" className="mt-6">
                            <PurchaseHistory />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
