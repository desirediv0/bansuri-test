"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/dropzone";

// Type definitions
interface User {
    id: string;
    name: string;
    email: string;
}

interface ZoomSession {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    price: number;
    isActive: boolean;
    thumbnailUrl?: string | null;
    subscribedUsers?: User[];
}

interface EditSessionState extends Omit<ZoomSession, 'startTime' | 'endTime'> {
    startTime: string;
    endTime: string;
    price: number;
    thumbnailUrl?: string | null;
}

interface Attendee {
    userId: string;
    name: string;
    email: string;
    subscriptionStatus: string;
    nextPaymentDue?: string;
}

interface ZoomSessionsTableProps {
    sessions: ZoomSession[];
    refreshData: () => void;
}

export default function ZoomSessionsTable({ sessions, refreshData }: ZoomSessionsTableProps) {
    const [editSession, setEditSession] = useState<EditSessionState | null>(null);
    const [selectedSession, setSelectedSession] = useState<ZoomSession | null>(null);
    const [viewAttendees, setViewAttendees] = useState<string | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { toast } = useToast();

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    const handleEdit = (session: ZoomSession): void => {
        setEditSession({
            ...session,
            startTime: new Date(session.startTime).toISOString().slice(0, 16),
            endTime: new Date(session.endTime).toISOString().slice(0, 16)
        });
    };

    const handleDelete = (session: ZoomSession): void => {
        setSelectedSession(session);
    };

    const handleViewAttendees = async (sessionId: string): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session/${sessionId}/attendees`,
                { withCredentials: true }
            );
            setAttendees(response.data.data.attendees);
            setViewAttendees(sessionId);
        } catch (error) {
            console.error("Error fetching attendees:", error);
            toast({
                title: "Error",
                description: "Failed to load attendees",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendReminders = async (sessionId: string): Promise<void> => {
        setIsLoading(true);
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session/${sessionId}/send-reminders`,
                {},
                { withCredentials: true }
            );
            toast({
                title: "Success",
                description: "Reminders sent successfully",
            });
        } catch (error) {
            console.error("Error sending reminders:", error);
            toast({
                title: "Error",
                description: "Failed to send reminders",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (fileUrl: string) => {
        if (editSession) {
            setEditSession({ ...editSession, thumbnailUrl: fileUrl });
        }
    };

    const deleteSession = async (): Promise<void> => {
        if (!selectedSession) return;

        setIsLoading(true);
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session/${selectedSession.id}`,
                { withCredentials: true }
            );

            toast({
                title: "Success",
                description: "Session deleted successfully",
            });

            setSelectedSession(null);
            refreshData();
        } catch (error) {
            console.error("Error deleting session:", error);
            toast({
                title: "Error",
                description: "Failed to delete session",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateSession = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!editSession) return;

        setIsLoading(true);

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session/${editSession.id}`,
                {
                    title: editSession.title,
                    description: editSession.description,
                    startTime: editSession.startTime,
                    endTime: editSession.endTime,
                    price: parseFloat(editSession.price.toString()),
                    isActive: editSession.isActive,
                    thumbnailUrl: editSession.thumbnailUrl
                },
                { withCredentials: true }
            );

            toast({
                title: "Success",
                description: "Session updated successfully",
            });

            setEditSession(null);
            refreshData();
        } catch (error) {
            console.error("Error updating session:", error);
            toast({
                title: "Error",
                description: "Failed to update session",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Thumbnail</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscribers</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell>
                                {session.thumbnailUrl ? (
                                    <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                        <Image
                                            src={session.thumbnailUrl}
                                            alt={session.title}
                                            fill
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                                        No image
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{session.title}</TableCell>
                            <TableCell>{formatDate(session.startTime)}</TableCell>
                            <TableCell>{formatDate(session.endTime)}</TableCell>
                            <TableCell>₹{session.price}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded text-sm ${session.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {session.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </TableCell>
                            <TableCell>{session.subscribedUsers?.length || 0}</TableCell>
                            <TableCell className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(session)}>
                                    <Edit size={16} />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(session)}>
                                    <Trash2 size={16} />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleViewAttendees(session.id)}>
                                    <Users size={16} />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleSendReminders(session.id)}>
                                    <Send size={16} />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Edit Session Dialog */}
            {editSession && (
                <Dialog open={!!editSession} onOpenChange={(open) => !open && setEditSession(null)}>
                    <DialogContent className="max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Edit Zoom Session</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={updateSession} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={editSession.title}
                                    onChange={(e) => setEditSession({ ...editSession, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={editSession.description || ''}
                                    onChange={(e) => setEditSession({ ...editSession, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="datetime-local"
                                        value={editSession.startTime}
                                        onChange={(e) => setEditSession({ ...editSession, startTime: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="datetime-local"
                                        value={editSession.endTime}
                                        onChange={(e) => setEditSession({ ...editSession, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editSession.price}
                                    onChange={(e) => setEditSession({ ...editSession, price: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Thumbnail Image</Label>
                                <FileUpload
                                    onUploadComplete={handleImageUpload}
                                    existingImageUrl={editSession.thumbnailUrl || null}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={editSession.isActive}
                                    onCheckedChange={(checked) => setEditSession({ ...editSession, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditSession(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Updating..." : "Update Session"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            {selectedSession && (
                <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to delete the session "{selectedSession.title}"?</p>
                        <p className="text-sm text-red-500">This action cannot be undone.</p>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedSession(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={deleteSession} disabled={isLoading}>
                                {isLoading ? "Deleting..." : "Delete Session"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* View Attendees Dialog */}
            {viewAttendees && (
                <Dialog open={!!viewAttendees} onOpenChange={(open) => !open && setViewAttendees(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Session Attendees</DialogTitle>
                        </DialogHeader>

                        {isLoading ? (
                            <div className="flex justify-center p-4">Loading attendees...</div>
                        ) : (
                            <div className="max-h-[60vh] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Next Payment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendees.length > 0 ? (
                                            attendees.map((attendee) => (
                                                <TableRow key={attendee.userId}>
                                                    <TableCell>{attendee.name}</TableCell>
                                                    <TableCell>{attendee.email}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded text-sm ${attendee.subscriptionStatus === 'ACTIVE'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {attendee.subscriptionStatus}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {attendee.nextPaymentDue
                                                            ? new Date(attendee.nextPaymentDue).toLocaleDateString()
                                                            : 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center">No attendees found</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={() => handleSendReminders(viewAttendees)} disabled={isLoading}>
                                Send Reminders
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
