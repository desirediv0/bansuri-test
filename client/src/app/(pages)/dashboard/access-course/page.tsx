"use client";

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User, Course, DashboardResponse } from './admin.type';

export default function AccessCoursePage() {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get<{ data: DashboardResponse }>(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard-data`, {
                withCredentials: true,
            }
            );
            setUsers(response.data.data.users);
            setCourses(response.data.data.courses);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch dashboard data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const assignCourse = async (userId: string, courseId: string) => {
        try {
            setAssigning(courseId);
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/assign-course`,
                { userId, courseId },
                {
                    withCredentials: true,
                }
            );


            toast({
                title: "Success",
                description: "Course assigned successfully",
            });

            await fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to assign course",
                variant: "destructive",
            });
        } finally {
            setAssigning('');
        }
    };

    const assignMultipleCourses = async (userId: string) => {
        try {
            setAssigning('multiple');
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/assign-bulk-courses`,
                {
                    assignments: [{
                        userId,
                        courseIds: selectedCourses
                    }]
                },
                {
                    withCredentials: true,
                }
            );

            toast({
                title: "Success",
                description: "Courses assigned successfully",
            });

            setSelectedCourses([]);
            await fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to assign courses",
                variant: "destructive",
            });
        } finally {
            setAssigning('');
        }
    };

    const removeCourseAccess = async (userId: string, courseId: string) => {
        try {
            setAssigning(`removing-${courseId}`);
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/remove-course-access`,
                { userId, courseId },
                { withCredentials: true }
            );

            toast({
                title: "Success",
                description: "Course access removed successfully",
            });

            await fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove course access",
                variant: "destructive",
            });
        } finally {
            setAssigning('');
        }
    };

    const isUserEnrolled = (user: User, courseId: string) => {
        return user.enrollments.some(e => e.course.id === courseId) ||
            user.purchases.some(p => p.course.id === courseId);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderDialogContent = (user: User) => (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                    Manage Course Access for {user.name}
                </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                {courses.map((course) => {
                    const isEnrolled = isUserEnrolled(user, course.id);
                    return (
                        <div
                            key={course.id}
                            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${isEnrolled ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <input
                                    type="checkbox"
                                    checked={selectedCourses.includes(course.id) || isEnrolled}
                                    onChange={(e) => {
                                        if (isEnrolled) {
                                            // If enrolled, clicking checkbox will remove access
                                            removeCourseAccess(user.id, course.id);
                                        } else {
                                            if (e.target.checked) {
                                                setSelectedCourses([...selectedCourses, course.id]);
                                            } else {
                                                setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                                            }
                                        }
                                    }}
                                    className="h-4 w-4"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 truncate">
                                        {course.title}
                                        {isEnrolled && (
                                            <span className="ml-2 text-xs text-green-600">
                                                (Already Enrolled)
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {course.category.name} • {course.language}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <Button
                    variant="outline"
                    onClick={() => setSelectedCourses([])}
                >
                    Clear Selection
                </Button>
                <Button
                    onClick={() => assignMultipleCourses(user.id)}
                    disabled={selectedCourses.length === 0 || assigning === 'multiple'}
                >
                    {assigning === 'multiple' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        `Assign ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''}`
                    )}
                </Button>
            </div>
        </DialogContent>
    );

    return (
        <div className="container mx-auto py-10">
            <Card className="shadow-md">
                <CardHeader className="space-y-6">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        User Course Management
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                        <Input
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm('')}
                            className="text-gray-500"
                        >
                            Clear
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Name</TableHead>
                                        <TableHead className="w-[250px]">Email</TableHead>
                                        <TableHead className="w-[100px]">Type</TableHead>
                                        <TableHead className="w-[200px]">Purchased</TableHead>
                                        <TableHead className="w-[200px]">Enrolled</TableHead>
                                        <TableHead className="w-[150px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">
                                                        {user.usertype}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {user.purchases.length > 0
                                                        ? user.purchases.map(p => p.course.title).join(", ")
                                                        : "No purchases"}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {user.enrollments.length > 0
                                                        ? user.enrollments.map(e => e.course.title).join(", ")
                                                        : "Not enrolled"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                Manage Access
                                                            </Button>
                                                        </DialogTrigger>
                                                        {renderDialogContent(user)}
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}